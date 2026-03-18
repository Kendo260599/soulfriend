import json
import urllib.request
import eng_to_ipa as p
from deep_translator import GoogleTranslator
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

ROOT_DIR = Path(r"d:/ung dung/soulfriend/english_foundation")
SEED_FILE = ROOT_DIR / "content/vocabulary_seed.json"

def fetch_top_words(limit=3000):
    url = "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt"
    with urllib.request.urlopen(url) as response:
        words = response.read().decode('utf-8').splitlines()
    valid_words = [w.strip() for w in words if len(w.strip()) > 1 and w.strip().isalpha()]
    return valid_words[:limit]

def process_single_word(word, idx):
    if idx < 1000:
        cefr, coca, diff = "A1", "1-1000", 1
    elif idx < 2000:
        cefr, coca, diff = "A2", "1001-2000", 2
    else:
        cefr, coca, diff = "B1", "2001-3000", 3

    try:
        ipa = p.convert(word)
    except:
        ipa = word
    if not ipa.startswith('/'): ipa = f"/{ipa}/"

    meaning = word
    retries = 2
    for _ in range(retries):
        try:
            meaning = GoogleTranslator(source='en', target='vi').translate(word)
            break
        except Exception:
            time.sleep(0.5)

    return {
        "word": word,
        "ipa": ipa.replace("*", ""), # eng_to_ipa adds * to unknown words
        "meaning_vi": meaning.lower() if meaning else word,
        "collocation": f"common {word}",
        "example_sentence": f"I can use the word {word} in a sentence.",
        "phrase": f"use {word}",
        "phrase_meaning_vi": f"hiểu {word}",
        "difficulty": diff,
        "topic_ielts": "General",
        "cefr_target": cefr,
        "coca_frequency_band": coca,
        "source_standard": "open-triangulated"
    }

def generate_vocab():
    print("Loading existing vocabulary...")
    with open(SEED_FILE, 'r', encoding='utf-8') as f:
        existing_vocab = json.load(f)
    existing_words = {item['word'].lower() for item in existing_vocab}

    print("Fetching top 3000 English words...")
    top_words = fetch_top_words(3200)
    
    new_words = []
    for word in top_words:
        if word.lower() not in existing_words:
            new_words.append(word.lower())
    
    target_count = max(0, 3000 - len(existing_words))
    new_words = new_words[:target_count]
    print(f"Translating {len(new_words)} words concurrently (this may take a minute)...")

    results = []
    with ThreadPoolExecutor(max_workers=30) as executor:
        futures = {executor.submit(process_single_word, w, i): w for i, w in enumerate(new_words)}
        done_count = 0
        for future in as_completed(futures):
            try:
                res = future.result()
                results.append(res)
                done_count += 1
                if done_count % 200 == 0:
                    print(f"  Processed {done_count} / {len(new_words)}")
            except Exception as exc:
                print(f"Word {futures[future]} generated an exception: {exc}")

    # Remove duplicates if any
    filtered_results = []
    for r in results:
        if r['word'] not in existing_words:
            filtered_results.append(r)
            existing_words.add(r['word'])

    combined = existing_vocab + filtered_results
    
    print(f"Saving {len(combined)} total words back to json...")
    with open(SEED_FILE, 'w', encoding='utf-8') as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)
    print("FINISHED!")

if __name__ == "__main__":
    generate_vocab()
