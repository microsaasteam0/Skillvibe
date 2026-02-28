import os
import sys
from pathlib import Path
from sqlalchemy import text
from sqlalchemy.orm import Session

# Add the backend directory to sys.path
backend_path = Path("e:/Hairscope/Work-Entrext/SkillVibe/backend").resolve()
sys.path.append(str(backend_path))

from database import engine

print("Updating database schema...")
try:
    with engine.begin() as connection:
        # Add company_info column to users table
        connection.execute(text("ALTER TABLE users ADD COLUMN company_info TEXT;"))
    print("Database schema updated successfully!")
except Exception as e:
    # It might already exist, or error
    print(f"Error updating schema: {e}")
