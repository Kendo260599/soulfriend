#!/usr/bin/env python3
import sqlite3
import json

DB_PATH = "db/english_foundation.db"

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# kiểm tra các cột trong grammar_units
cursor.execute("PRAGMA table_info(grammar_units)")
columns = cursor.fetchall()
print("Grammar units table columns:")
for col in columns:
    print(f"  - {col['name']}: {col['type']}")

# đếm số mục ngữ pháp
cursor.execute("SELECT COUNT(*) as count FROM grammar_units")
count = cursor.fetchone()['count']
print(f"\nTotal grammar patterns: {count}")

# lấy một vài mục để kiểm tra
cursor.execute("""
SELECT id, pattern, example, explanation_vi, explanation_en, usage_note 
FROM grammar_units 
LIMIT 3
""")
print("\nFirst 3 grammar patterns:")
for row in cursor.fetchall():
    print(f"\n  ID: {row['id']}")
    print(f"  Pattern: {row['pattern']}")
    print(f"  Example: {row['example']}")
    print(f"  Vi explanation: {row['explanation_vi'][:50] if row['explanation_vi'] else 'NULL'}...")
    print(f"  En explanation: {row['explanation_en'][:50] if row['explanation_en'] else 'NULL'}...")

conn.close()
print("\n✅ Grammar data check complete!")
