
from database import SessionLocal
from models import Conversation, User

def check_convs():
    db = SessionLocal()
    convs = db.query(Conversation).all()
    for conv in convs:
        recruiter = db.query(User).filter(User.id == conv.recruiter_id).first()
        candidate = db.query(User).filter(User.id == conv.candidate_id).first()
        print(f"ID: {conv.id}")
        print(f"Recruiter: {recruiter.full_name} ({recruiter.email}) [ID:{recruiter.id}, Role:{recruiter.role}]")
        print(f"Candidate: {candidate.full_name} ({candidate.email}) [ID:{candidate.id}, Role:{candidate.role}]")
        print(f"Last Msg: {conv.last_message}")
        print("-" * 20)
    db.close()

if __name__ == "__main__":
    check_convs()
