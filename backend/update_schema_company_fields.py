import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

with engine.begin() as connection:
    try:
        connection.execute(text("ALTER TABLE users ADD COLUMN company_location VARCHAR;"))
        print("Added company_location")
    except Exception as e:
        print("Error:", e)
    
    try:
        connection.execute(text("ALTER TABLE users ADD COLUMN company_overview TEXT;"))
        print("Added company_overview")
    except Exception as e:
        print("Error:", e)

print("Schema update complete")
