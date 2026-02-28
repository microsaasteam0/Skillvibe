from database import engine
from sqlalchemy import text
import sys

try:
    with engine.connect() as conn:
        res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'trust_score'")).fetchone()
        if res:
            print("COLUMN_EXISTS")
        else:
            print("COLUMN_NOT_FOUND")
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
