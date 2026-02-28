from sqlalchemy import text
from database import engine
import os

def run_migration():
    with engine.begin() as conn:
        print(f"Running migration on database: {engine.url.drivername}")
        
        # 1. Add Trust Columns to Profiles
        print("Checking Profile columns...")
        columns_to_add = [
            ("trust_score", "FLOAT DEFAULT 0.0"),
            ("is_verified_trust", "BOOLEAN DEFAULT FALSE")
        ]
        
        for col_name, col_type in columns_to_add:
            try:
                # Different syntax for SQLite vs Postgres for BOOLEAN default
                type_str = col_type
                if "sqlite" in engine.url.drivername and "is_verified_trust" in col_name:
                    type_str = "BOOLEAN DEFAULT 0"
                
                conn.execute(text(f"ALTER TABLE profiles ADD COLUMN {col_name} {type_str}"))
                print(f"Successfully added column: {col_name}")
            except Exception as e:
                # If column already exists, it will error, which is fine
                if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                    print(f"Column {col_name} already exists.")
                else:
                    print(f"Error adding {col_name}: {e}")

        # 2. Create VibeNotes Table
        print("Creating vibe_notes table...")
        try:
            # Handle serial/autoincrement differences
            id_type = "SERIAL PRIMARY KEY" if "postgre" in engine.url.drivername else "INTEGER PRIMARY KEY AUTOINCREMENT"
            
            conn.execute(text(f"""
                CREATE TABLE IF NOT EXISTS vibe_notes (
                    id {id_type},
                    profile_id INTEGER NOT NULL REFERENCES profiles(id),
                    author_id INTEGER NOT NULL REFERENCES users(id),
                    content TEXT NOT NULL,
                    vibe_type TEXT DEFAULT 'professional',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            print("Successfully verified vibe_notes table")
        except Exception as e:
            print(f"Error creating vibe_notes table: {e}")

if __name__ == "__main__":
    run_migration()
