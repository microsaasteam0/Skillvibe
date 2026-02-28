from database import engine
from sqlalchemy import text
import sys

def run_migration():
    print("🚀 Starting Migration: Adding verification_stage to profiles...")
    
    try:
        # Check first
        with engine.connect() as conn:
            check_sql = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='profiles' AND column_name='verification_stage';
            """)
            result = conn.execute(check_sql).fetchone()
            
            if result:
                print("ℹ️ Column already exists, skipping.")
                return

        # Apply in a transaction
        with engine.begin() as conn:
            print("➕ Adding verification_stage column...")
            conn.execute(text("ALTER TABLE profiles ADD COLUMN verification_stage INTEGER DEFAULT 1;"))
            print("✅ Column added successfully.")
                
        print("Done.")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
