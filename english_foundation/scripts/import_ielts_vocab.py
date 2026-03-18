import sqlite3
import urllib.request
from pathlib import Path

ROOT_DIR = Path(r"d:/ung dung/soulfriend/english_foundation")
SRC_FILE = ROOT_DIR / "ielts_vocab_cleaned.txt"
DB_FILE = ROOT_DIR / "db/english_foundation.db"

def import_vocab():
    print(f"Reading {SRC_FILE}...")
    with open(SRC_FILE, 'r', encoding='utf-8') as f:
        lines = f.read().splitlines()
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Run migrations just in case
    from english_foundation.db.bootstrap import migrate_schema
    migrate_schema(conn)

    inserted = 0
    updated = 0

    for line in lines:
        if not line.strip(): continue
        parts = line.split('\t')
        if len(parts) >= 4:
            word = parts[0].strip()
            pos = parts[1].strip()
            ipa = parts[2].strip()
            meaning = parts[3].strip()
        else:
            continue

        # Check if exists
        row = cursor.execute("SELECT id FROM vocabulary WHERE word = ?", (word.lower(),)).fetchone()
        if row:
            # Update existing
            cursor.execute("UPDATE vocabulary SET part_of_speech = ?, ipa = ?, meaning_vi = ? WHERE id = ?", (pos, ipa, meaning, row[0]))
            updated += 1
        else:
            # Insert new
            cursor.execute('''
                INSERT INTO vocabulary 
                (word, part_of_speech, ipa, meaning_vi, difficulty, example_sentence, collocation, topic_ielts, cefr_target, coca_frequency_band, source_standard)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (word.lower(), pos, ipa, meaning, 3, f"A good example for {word}.", f"common {word}", "General", "B1", "New", "user-import"))
            inserted += 1

    conn.commit()
    conn.close()
    print(f"Done! Inserted {inserted} new words. Updated {updated} existing words.")

if __name__ == "__main__":
    import sys
    sys.path.append(r"d:/ung dung/soulfriend")
    import_vocab()
