import sqlite3
import os

db_path = os.path.join('backend', 'snippetstream.db')
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    # Try root
    db_path = 'snippetstream.db'

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, user_id, slug, landing_page_data IS NOT NULL FROM profiles")
    rows = cursor.fetchall()
    print("Profiles in DB:")
    for row in rows:
        print(row)
    conn.close()
else:
    print("Database file NOT found.")
