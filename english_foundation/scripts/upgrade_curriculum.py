import sqlite3
from pathlib import Path

DB_PATH = Path('d:/ung dung/soulfriend/english_foundation/db/english_foundation.db')

def run_migration():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Ensure columns exist via bootstrap script logic (just in case)
    import sys
    sys.path.append('d:/ung dung/soulfriend')
    from english_foundation.db.bootstrap import migrate_schema
    migrate_schema(conn)

    print("Migrating vocabulary into units of 50...")
    c.execute("SELECT id FROM vocabulary ORDER BY id ASC")
    rows = c.fetchall()
    
    updates = []
    unit = 1
    count = 0
    for row in rows:
        updates.append((unit, row[0]))
        count += 1
        if count >= 50:
            count = 0
            unit += 1
            
    c.executemany("UPDATE vocabulary SET unit_id = ? WHERE id = ?", updates)
    conn.commit()
    print(f"Assigned 3370 words into {unit} units.")
    
    c.execute("UPDATE learner_profile SET current_vocab_unit = 1")
    conn.commit()
    print("Reset learner current_vocab_unit to 1.")

if __name__ == "__main__":
    run_migration()
