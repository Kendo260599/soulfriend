import re
import json

TXT_PATH = 'd:/ung dung/soulfriend/english_foundation/ielts_vocab_extracted.txt'
CLEANED_PATH = 'd:/ung dung/soulfriend/english_foundation/ielts_vocab_cleaned.txt'
OUT_PATH = 'd:/ung dung/soulfriend/english_foundation/ielts_vocab_seed_generated.json'

with open(TXT_PATH, 'r', encoding='utf-8') as f:
    raw = f.read()

lines = [line.strip() for line in raw.splitlines() if line.strip()]

ignore_patterns = [
    r'^\d+$', r'^STT$', r'^Từ vựng$', r'^Loại từ$', r'^Phiên âm$', r'^Nghĩa của từ$', r'^mochidemy.com$',
    r'^MochiMochi$', r'^\d+ từ vựng IELTS thông dụng nhất$', r'^\f$', r'^Page.*$', r'^\d+/\d+$', r'^\d+$'
]
def is_ignore(line):
    for pat in ignore_patterns:
        if re.match(pat, line):
            return True
    return False

filtered = [l for l in lines if not is_ignore(l)]

def is_word(line):
    # Từ tiếng Anh, không chứa dấu tiếng Việt, không phải loại từ, không phải IPA
    return re.match(r'^[a-zA-Z\- ]{2,}$', line) and not is_word_type(line) and not is_ipa(line)

def is_word_type(line):
    # n, v, adj, adv, n, v, adj, v, n, v, adj, n, v, adj, adv, n, v, adj, v, n, v, adj, adv, n, v, adj, v, n, v, adj, adv
    return re.match(r'^(n|v|adj|adv|n, v|n, adj|v, n|adj, n|adv, v|n, v, adj|n, adv|v, adv|adj, adv|n, v, adv|n, adj, adv|v, adj, adv|n, v, adj, adv|n, v, adj, adv, n, v, adj, adv|n, v, adj, adv, n, v, adj, adv|n, v, adj, adv, n, v, adj, adv|n, v, adj, adv, n, v, adj, adv)$', line) or (len(line) <= 6 and ',' in line)

def is_ipa(line):
    return line.startswith('/') and line.endswith('/') and len(line) > 2

def is_meaning(line):
    # Nghĩa tiếng Việt, có dấu hoặc nhiều từ, không phải loại từ, không phải IPA
    return not is_word(line) and not is_word_type(line) and not is_ipa(line) and len(line) > 1

# Dò từng dòng, ghép block đúng vị trí các trường
groups = []
word = word_type = ipa = meaning = None
for line in filtered:
    if is_word(line):
        if word and word_type and ipa and meaning:
            groups.append([word, word_type, ipa, meaning])
        word = line
        word_type = ipa = meaning = None
    elif is_word_type(line):
        word_type = line
    elif is_ipa(line):
        ipa = line
    elif is_meaning(line):
        meaning = line
# Lưu block cuối cùng nếu đủ trường
if word and word_type and ipa and meaning:
    groups.append([word, word_type, ipa, meaning])

# Xuất ra file txt đã căn chỉnh (mỗi block 1 dòng, các trường cách nhau bằng tab)
with open(CLEANED_PATH, 'w', encoding='utf-8') as f:
    for block in groups:
        f.write('\t'.join(block) + '\n')

print(f'Đã xuất {len(groups)} block từ vựng sang {CLEANED_PATH}')

# Sinh vocab JSON từ file đã căn chỉnh
vocab_json = []
with open(CLEANED_PATH, 'r', encoding='utf-8') as f:
    for line in f:
        parts = line.strip().split('\t')
        if len(parts) == 4:
            word, word_type, ipa, meaning = parts
            def gen_collocation(word, word_type):
                if word_type.startswith('v'):
                    return f"{word} a problem"
                if word_type.startswith('n'):
                    return f"important {word}"
                if word_type.startswith('adj'):
                    return f"very {word}"
                return f"use {word}"
            def gen_example(word, meaning):
                return f"I want to {word} every day." if 'v' in meaning or word_type.startswith('v') else f"This is an example of {word}."
            def gen_phrase(word):
                return f"{word} up"
            def gen_phrase_meaning(meaning):
                return f"{meaning} (cụm từ)"
            item = {
                "word": word,
                "ipa": ipa,
                "meaning_vi": meaning,
                "collocation": gen_collocation(word, word_type),
                "example_sentence": gen_example(word, meaning),
                "phrase": gen_phrase(word),
                "phrase_meaning_vi": gen_phrase_meaning(meaning),
                "difficulty": 1,
                "topic_ielts": "General",
                "cefr_target": "A2",
                "coca_frequency_band": "1001-2000",
                "source_standard": "auto-generated"
            }
            vocab_json.append(item)

with open(OUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(vocab_json, f, ensure_ascii=False, indent=2)

print(f'Generated {len(vocab_json)} vocab items to {OUT_PATH}')
