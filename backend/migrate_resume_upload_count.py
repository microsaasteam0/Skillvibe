from database import engine
from sqlalchemy import text
import sys

def run_migration():
    print("🚀 Starting Migration: Adding resume_upload_count to users...")
    
    try:
        # Check first
        with engine.connect() as conn:
            check_sql = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='resume_upload_count';
            """)
            result = conn.execute(check_sql).fetchone()
            
            if result:
                print("ℹ️ Column already exists, skipping.")
                return

        # Apply in a transaction
        with engine.begin() as conn:
            print("➕ Adding resume_upload_count column...")
            conn.execute(text("ALTER TABLE users ADD COLUMN resume_upload_count INTEGER DEFAULT 0;"))
            print("✅ Column added successfully.")
                
        print("✓ Migration completed.")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
