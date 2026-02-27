import sys
import os
from pathlib import Path

# Add the backend directory to sys.path
backend_path = Path("e:/Hairscope/Work-Entrext/SkillVibe/backend").resolve()
sys.path.append(str(backend_path))

from database import create_tables, engine
from models import Base

print("Initializing database and creating tables...")
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
except Exception as e:
    print(f"Error creating tables: {e}")
