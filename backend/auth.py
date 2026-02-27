from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from jwt import PyJWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models import User
from db_utils import db_retry
import os
from dotenv import load_dotenv
import requests
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
import secrets
import string

load_dotenv()

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Google OAuth configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

# Print environment check on startup
print(f"[INFO] Environment Check:")
print(f"   GOOGLE_CLIENT_ID: {'[OK] Set' if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID != 'your-google-client-id' else '[FAIL] Not set'}")
print(f"   GOOGLE_CLIENT_SECRET: {'[OK] Set' if GOOGLE_CLIENT_SECRET and GOOGLE_CLIENT_SECRET != 'your-google-client-secret' else '[FAIL] Not set'}")
print(f"   SECRET_KEY: {'[OK] Set' if SECRET_KEY and SECRET_KEY != 'your-secret-key-change-in-production' else '[FAIL] Not set'}")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str, token_type: str = "access"):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type_check: str = payload.get("type")
        
        if email is None or token_type_check != token_type:
            return None
        return email
    except PyJWTError:
        return None

@db_retry(max_retries=3, delay=0.5)
def get_user_by_email(db: Session, email: str):
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()

@db_retry(max_retries=3, delay=0.5)
def get_user_by_username(db: Session, username: str):
    """Get user by username"""
    return db.query(User).filter(User.username == username).first()

@db_retry(max_retries=3, delay=0.5)
def authenticate_user(db: Session, email: str, password: str):
    """Authenticate user with email and password"""
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not user.hashed_password:  # OAuth user trying to login with password
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

@db_retry(max_retries=3, delay=0.5)
def get_user_by_google_id(db: Session, google_id: str):
    """Get user by Google ID"""
    return db.query(User).filter(User.google_id == google_id).first()

def generate_username_from_email(email: str, db: Session) -> str:
    """Generate a unique username from email"""
    base_username = email.split('@')[0]
    username = base_username
    counter = 1
    
    while get_user_by_username(db, username):
        username = f"{base_username}{counter}"
        counter += 1
    
    return username

async def verify_google_token(token: str) -> dict:
    """Verify Google ID token and return user info"""
    try:
        print(f"[INFO] Verifying Google token with Client ID: {GOOGLE_CLIENT_ID}")
        
        if not GOOGLE_CLIENT_ID or GOOGLE_CLIENT_ID == "your-google-client-id":
            raise ValueError("Google Client ID not configured properly")
        
        # Verify the token with Google
        idinfo = id_token.verify_oauth2_token(
            token, google_requests.Request(), GOOGLE_CLIENT_ID
        )
        
        print(f"[OK] Google token verified successfully for: {idinfo.get('email')}")
        print(f"[INFO] Profile picture URL from Google: {idinfo.get('picture', '')}")
        
        # Verify the issuer
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')
        
        picture_url = idinfo.get('picture', '')
        print(f"[INFO] Final picture URL: {picture_url}")
        
        return {
            'google_id': idinfo['sub'],
            'email': idinfo['email'],
            'name': idinfo.get('name', ''),
            'picture': picture_url,
            'email_verified': idinfo.get('email_verified', False)
        }
    except ValueError as e:
        print(f"[ERROR] Google token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid Google token: {str(e)}"
        )
    except Exception as e:
        print(f"[ERROR] Unexpected error in Google token verification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google token verification failed: {str(e)}"
        )

@db_retry(max_retries=3, delay=0.5)
def create_google_user(db: Session, google_info: dict):
    """Create new user from Google OAuth info"""
    username = generate_username_from_email(google_info['email'], db)
    
    db_user = User(
        email=google_info['email'],
        username=username,
        full_name=google_info['name'],
        google_id=google_info['google_id'],
        profile_picture=google_info['picture'],
        auth_provider='google',
        is_verified=google_info['email_verified'],
        hashed_password=None  # No password for OAuth users
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current authenticated user with real-time subscription checking"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        email = verify_token(token, "access")
        if email is None:
            raise credentials_exception
    except PyJWTError:
        raise credentials_exception
    
    user = get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    
    # Real-time subscription expiration check
    try:
        from subscription_manager import subscription_manager
        subscription_status = subscription_manager.check_user_subscription_status(user.id, db)
        
        # Update user's premium status if it changed
        if subscription_status != user.is_premium:
            user.is_premium = subscription_status
            # Note: The subscription_manager already commits the changes
            
            # Refresh user object to get updated data
            db.refresh(user)
            
    except Exception as e:
        # Log the error but don't fail authentication
        print(f"Warning: Subscription check failed for user {user.id}: {e}")
    
    return user

optional_security = HTTPBearer(auto_error=False)

async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: Session = Depends(get_db)
):
    """Get current user if authenticated, else return None"""
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        email = verify_token(token, "access")
        if email is None:
            return None
        
        user = get_user_by_email(db, email=email)
        return user
    except Exception:
        return None

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

@db_retry(max_retries=3, delay=0.5)
def create_user(db: Session, email: str, username: str, password: str, full_name: str = None, role: str = "founder"):
    """Create new user"""
    hashed_password = get_password_hash(password)
    verification_token = secrets.token_hex(32)
    db_user = User(
        email=email,
        username=username,
        full_name=full_name,
        role=role,
        hashed_password=hashed_password,
        verification_token=verification_token,
        auth_provider='local'
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Rate limiting for free users
def check_rate_limit(user: User, db: Session) -> bool:
    """Check if user has exceeded rate limit"""
    try:
        limit = 20 if user.is_premium else 2
        
        # Check usage in last 24 hours
        from datetime import datetime, timedelta, timezone
        from models import UsageStats
        
        twenty_four_hours_ago = datetime.now(timezone.utc) - timedelta(hours=24)
        recent_usage = db.query(UsageStats).filter(
            UsageStats.user_id == user.id,
            UsageStats.action == "generate",
            UsageStats.created_at >= twenty_four_hours_ago
        ).count()
        
        return recent_usage < limit
        
    except Exception as e:
        print(f"Error in check_rate_limit: {e}")
        # If there's an error checking the rate limit, assume it's exceeded for safety
        return False
