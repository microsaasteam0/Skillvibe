
import os
import uuid
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def update_schema():
    with engine.begin() as connection:
        try:
            connection.execute(text("ALTER TABLE conversations ADD COLUMN chat_id VARCHAR;"))
            print("Added chat_id column to conversations")
        except Exception as e:
            print("Chat_id column might already exist or error:", e)

    # Populate existing conversations with UUIDs
    db = SessionLocal()
    try:
        from models import Conversation
        convs = db.query(Conversation).filter(Conversation.chat_id == None).all()
        print(f"Found {len(convs)} conversations to update")
        for conv in convs:
            # Create a more professional looking ID like SV-XXXXXX
            random_id = f"sv_{uuid.uuid4().hex[:12]}"
            conv.chat_id = random_id
            print(f"Setting Conv {conv.id} -> {random_id}")
        db.commit()
    except Exception as e:
        print("Error populating chat_id:", e)
    finally:
        db.close()

if __name__ == "__main__":
    update_schema()
