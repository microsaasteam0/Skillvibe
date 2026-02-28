from database import engine
from sqlalchemy import text

def fix():
    with engine.connect() as conn:
        print("Checking custom_templates columns...")
        try:
            conn.execute(text("ALTER TABLE custom_templates ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;"))
            conn.execute(text("ALTER TABLE custom_templates ADD COLUMN IF NOT EXISTS tags VARCHAR;"))
            conn.commit()
            print("Successfully added columns to custom_templates")
        except Exception as e:
            print(f"Error updating custom_templates: {e}")

if __name__ == "__main__":
    fix()
