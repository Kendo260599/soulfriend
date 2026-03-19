#!/usr/bin/env python3
"""
Expand vocabulary seed with A1/A2 level words
"""

import json
from pathlib import Path

# Read existing seed
seed_path = Path(__file__).parent / 'content' / 'vocabulary_seed.json'
with open(seed_path, encoding='utf-8') as f:
    existing = json.load(f)

existing_words = {item['word'] for item in existing}
print(f"Existing vocabulary: {len(existing_words)} words")

# Extended vocabulary for A1/A2
additional_vocab = [
    {"word": "hello", "ipa": "/həˈloʊ/", "meaning_vi": "xin chào", "collocation": "say hello", "example_sentence": "Hello, how are you?", "phrase": "hello there", "phrase_meaning_vi": "xin chào", "difficulty": 1, "topic_ielts": "Greetings", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "goodbye", "ipa": "/ɡʊdˈbaɪ/", "meaning_vi": "tạm biệt", "collocation": "say goodbye", "example_sentence": "Goodbye, see you tomorrow.", "phrase": "say goodbye", "phrase_meaning_vi": "nói tạm biệt", "difficulty": 1, "topic_ielts": "Greetings", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "please", "ipa": "/pliːz/", "meaning_vi": "vui lòng", "collocation": "say please", "example_sentence": "Please help me.", "phrase": "if you please", "phrase_meaning_vi": "xin vui lòng", "difficulty":1, "topic_ielts": "Politeness", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "thank you", "ipa": "/θæŋk juː/", "meaning_vi": "cảm ơn", "collocation": "say thank you", "example_sentence": "Thank you for helping.", "phrase": "thank you very much", "phrase_meaning_vi": "cảm ơn rất nhiều", "difficulty": 1, "topic_ielts": "Politeness", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "sorry", "ipa": "/ˈsɑːri/", "meaning_vi": "xin lỗi", "collocation": "say sorry", "example_sentence": "I'm sorry I'm late.", "phrase": "i'm so sorry", "phrase_meaning_vi": "tôi thực sự xin lỗi", "difficulty": 1, "topic_ielts": "Politeness", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "yes", "ipa": "/jɛs/", "meaning_vi": "vâng", "collocation": "say yes", "example_sentence": "Yes, I agree.", "phrase": "yes please", "phrase_meaning_vi": "vâng, vui lòng", "difficulty": 1, "topic_ielts": "Basic", "cefr_target": "A1", "coca_frequency_band": "1-300", "source_standard": "core-a1"},
    {"word": "no", "ipa": "/noʊ/", "meaning_vi": "không", "collocation": "say no", "example_sentence": "No, thank you.", "phrase": "no way", "phrase_meaning_vi": "không, không thể", "difficulty": 1, "topic_ielts": "Basic", "cefr_target": "A1", "coca_frequency_band": "1-300", "source_standard": "core-a1"},
    {"word": "water", "ipa": "/ˈwɔːtər/", "meaning_vi": "nước", "collocation": "drink water", "example_sentence": "Please bring me a glass of water.", "phrase": "glass of water", "phrase_meaning_vi": "ly nước", "difficulty": 1, "topic_ielts": "Food & Drink", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "food", "ipa": "/fuːd/", "meaning_vi": "thức ăn", "collocation": "eat food", "example_sentence": "The food is delicious.", "phrase": "food and drink", "phrase_meaning_vi": "ăn uống", "difficulty": 1, "topic_ielts": "Food & Drink", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "coffee", "ipa": "/ˈkɔːfi/", "meaning_vi": "cà phê", "collocation": "drink coffee", "example_sentence": "I drink coffee in the morning.", "phrase": "cup of coffee", "phrase_meaning_vi": "tách cà phê", "difficulty": 1, "topic_ielts": "Food & Drink", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "tea", "ipa": "/tiː/", "meaning_vi": "trà", "collocation": "drink tea", "example_sentence": "She likes tea with sugar.", "phrase": "cup of tea", "phrase_meaning_vi": "tách trà", "difficulty": 1, "topic_ielts": "Food & Drink", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "apple", "ipa": "/ˈæpəl/", "meaning_vi": "táo", "collocation": "eat apple", "example_sentence": "This apple is red.", "phrase": "apple pie", "phrase_meaning_vi": "bánh táo", "difficulty": 1, "topic_ielts": "Food", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "bread", "ipa": "/brɛd/", "meaning_vi": "bánh", "collocation": "eat bread", "example_sentence": "I have bread for breakfast.", "phrase": "piece of bread", "phrase_meaning_vi": "lát bánh", "difficulty": 1, "topic_ielts": "Food", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "egg", "ipa": "/ɛɡ/", "meaning_vi": "trứng", "collocation": "cook egg", "example_sentence": "Would you like fried or boiled eggs?", "phrase": "fried egg", "phrase_meaning_vi": "trứng chiên", "difficulty": 1, "topic_ielts": "Food", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "milk", "ipa": "/mɪlk/", "meaning_vi": "sữa", "collocation": "drink milk", "example_sentence": "Milk is good for health.", "phrase": "glass of milk", "phrase_meaning_vi": "ly sữa", "difficulty": 1, "topic_ielts": "Food", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "house", "ipa": "/haʊs/", "meaning_vi": "nhà", "collocation": "live in house", "example_sentence": "I live in a big house.", "phrase": "at home", "phrase_meaning_vi": "ở nhà", "difficulty": 1, "topic_ielts": "Housing", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "room", "ipa": "/ruːm/", "meaning_vi": "phòng", "collocation": "go to room", "example_sentence": "The room is bright and clean.", "phrase": "living room", "phrase_meaning_vi": "phòng khách", "difficulty": 1, "topic_ielts": "Housing", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "door", "ipa": "/dɔːr/", "meaning_vi": "cửa", "collocation": "open door", "example_sentence": "Please close the door.", "phrase": "next door", "phrase_meaning_vi": "bên cạnh", "difficulty": 1, "topic_ielts": "Housing", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "window", "ipa": "/ˈwɪndoʊ/", "meaning_vi": "cửa sổ", "collocation": "look out window", "example_sentence": "The window is open.", "phrase": "window pane", "phrase_meaning_vi": "tấm kiếng cửa sổ", "difficulty": 1, "topic_ielts": "Housing", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "bed", "ipa": "/bɛd/", "meaning_vi": "giường", "collocation": "sleep in bed", "example_sentence": "I go to bed at night.", "phrase": "go to bed", "phrase_meaning_vi": "đi ngủ", "difficulty": 1, "topic_ielts": "Housing", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "chair", "ipa": "/tʃɛr/", "meaning_vi": "ghế", "collocation": "sit in chair", "example_sentence": "Please sit in the chair.", "phrase": "armchair", "phrase_meaning_vi": "ghế tay vịn", "difficulty": 1, "topic_ielts": "Furniture", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "table", "ipa": "/ˈteɪbəl/", "meaning_vi": "bàn", "collocation": "sit at table", "example_sentence": "We eat at the dining table.", "phrase": "dining table", "phrase_meaning_vi": "bàn ăn", "difficulty": 1, "topic_ielts": "Furniture", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "book", "ipa": "/bʊk/", "meaning_vi": "sách", "collocation": "read book", "example_sentence": "I like to read books.", "phrase": "book store", "phrase_meaning_vi": "cửa hàng sách", "difficulty": 1, "topic_ielts": "Media", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "phone", "ipa": "/foʊn/", "meaning_vi": "điện thoại", "collocation": "use phone", "example_sentence": "My phone is new.", "phrase": "cell phone", "phrase_meaning_vi": "điện thoại di động", "difficulty": 1, "topic_ielts": "Technology", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "computer", "ipa": "/kəmˈpjuːtər/", "meaning_vi": "máy tính", "collocation": "use computer", "example_sentence": "I work on the computer.", "phrase": "personal computer", "phrase_meaning_vi": "máy tính cá nhân", "difficulty": 1, "topic_ielts": "Technology", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "car", "ipa": "/kɑːr/", "meaning_vi": "ô tô", "collocation": "drive car", "example_sentence": "I drive a car to work.", "phrase": "by car", "phrase_meaning_vi": "bằng ô tô", "difficulty": 1, "topic_ielts": "Transport", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "bike", "ipa": "/baɪk/", "meaning_vi": "xe đạp", "collocation": "ride bike", "example_sentence": "I ride my bike to school.", "phrase": "on a bike", "phrase_meaning_vi": "trên xe đạp", "difficulty": 1, "topic_ielts": "Transport", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "school", "ipa": "/skuːl/", "meaning_vi": "trường học", "collocation": "go to school", "example_sentence": "I go to school every day.", "phrase": "at school", "phrase_meaning_vi": "ở trường", "difficulty": 1, "topic_ielts": "Education", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "teacher", "ipa": "/ˈtiːtʃər/", "meaning_vi": "giáo viên", "collocation": "talk to teacher", "example_sentence": "My teacher is helpful.", "phrase": "english teacher", "phrase_meaning_vi": "giáo viên tiếng Anh", "difficulty": 1, "topic_ielts": "Education", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "friend", "ipa": "/frɛnd/", "meaning_vi": "bạn", "collocation": "make friend", "example_sentence": "She is my best friend.", "phrase": "close friend", "phrase_meaning_vi": "bạn thân", "difficulty": 1, "topic_ielts": "Relationships", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "family", "ipa": "/ˈfæməli/", "meaning_vi": "gia đình", "collocation": "family time", "example_sentence": "I spend time with my family.", "phrase": "family member", "phrase_meaning_vi": "thành viên gia đình", "difficulty": 1, "topic_ielts": "Family", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "mother", "ipa": "/ˈmʌðər/", "meaning_vi": "mẹ", "collocation": "my mother", "example_sentence": "My mother is a doctor.", "phrase": "mother tongue", "phrase_meaning_vi": "tiếng mẹ đẻ", "difficulty": 1, "topic_ielts": "Family", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "father", "ipa": "/ˈfɑːðər/", "meaning_vi": "bố", "collocation": "my father", "example_sentence": "My father works as an engineer.", "phrase": "father and son", "phrase_meaning_vi": "cha và con", "difficulty": 1, "topic_ielts": "Family", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "sister", "ipa": "/ˈsɪstər/", "meaning_vi": "chị / em gái", "collocation": "my sister", "example_sentence": "My sister is younger than me.", "phrase": "little sister", "phrase_meaning_vi": "em gái", "difficulty": 1, "topic_ielts": "Family", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "brother", "ipa": "/ˈbrʌðər/", "meaning_vi": "anh / em trai", "collocation": "my brother", "example_sentence": "My brother plays football.", "phrase": "big brother", "phrase_meaning_vi": "anh trai", "difficulty": 1, "topic_ielts": "Family", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "dog", "ipa": "/dɔːɡ/", "meaning_vi": "chó", "collocation": "pet dog", "example_sentence": "I have a dog at home.", "phrase": "dog lover", "phrase_meaning_vi": "người yêu chó", "difficulty": 1, "topic_ielts": "Animals", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
    {"word": "cat", "ipa": "/kæt/", "meaning_vi": "mèo", "collocation": "pet cat", "example_sentence": "The cat is sleeping.", "phrase": "kitten", "phrase_meaning_vi": "mèo con", "difficulty": 1, "topic_ielts": "Animals", "cefr_target": "A1", "coca_frequency_band": "1-1000", "source_standard": "core-a1"},
]

# Filter out duplicates
new_vocab = [v for v in additional_vocab if v['word'] not in existing_words]
print(f"Adding {len(new_vocab)} new words...")

# Combine and save
combined = existing + new_vocab
with open(seed_path, 'w', encoding='utf-8') as f:
    json.dump(combined, f, ensure_ascii=False, indent=2)

print(f"✅ Vocabulary seed expanded to {len(combined)} words")
print(f"Location: {seed_path}")
