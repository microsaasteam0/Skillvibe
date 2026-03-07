
from database import SessionLocal
from models import User

def check_user():
    db = SessionLocal()
    # Search for Mohit Sharma or any user with recruiter role
    users = db.query(User).filter(User.full_name.ilike("%Mohit%")).all()
    if users:
        for user in users:
            print(f"--- User: {user.full_name} ({user.username}) ---")
            print(f"ID: {user.id}")
            print(f"Email: {user.email}")
            print(f"Role: {user.role}")
            print(f"Company Info: '{user.company_info}'")
            print(f"Company Location: '{user.company_location}'")
            print(f"Profile Pic: '{user.profile_picture}'")
    else:
        print("No user found with 'Mohit' in name")
    db.close()

if __name__ == "__main__":
    check_user()
