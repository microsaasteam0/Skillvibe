"""
Subscription Management System
Handles automatic expiration, grace periods, and subscription lifecycle
"""
import os
import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import and_
from database import get_db
from models import User, Subscription, PaymentHistory
import json
import uuid

def get_utc_now():
    """Get current UTC time with timezone awareness"""
    return datetime.now(timezone.utc)

def make_timezone_aware(dt):
    """Make a datetime timezone-aware if it isn't already"""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

class SubscriptionManager:
    def __init__(self):
        self.grace_period_days = int(os.getenv("SUBSCRIPTION_GRACE_PERIOD_DAYS", "3"))
        self.check_interval_hours = int(os.getenv("SUBSCRIPTION_CHECK_INTERVAL_HOURS", "6"))
        
    def check_expired_subscriptions(self, db: Session):
        """Check and handle expired subscriptions"""
        
        try:
            current_time = get_utc_now()
            grace_cutoff = current_time - timedelta(days=self.grace_period_days)
            
            print(f"[INFO] Checking for expired subscriptions at {current_time}")
            
            # Find subscriptions that are past their end date + grace period
            expired_subscriptions = db.query(Subscription).filter(
                and_(
                    Subscription.status == "active",
                    Subscription.current_period_end < grace_cutoff
                )
            ).all()
            
            expired_count = 0
            for subscription in expired_subscriptions:
                try:
                    user = db.query(User).filter(User.id == subscription.user_id).first()
                    if user and user.is_premium:
                        
                        print(f"[INFO] Expiring subscription for {user.email}")
                        print(f"   Subscription ID: {subscription.id}")
                        print(f"   Period ended: {subscription.current_period_end}")
                        print(f"   Grace period ended: {grace_cutoff}")
                        
                        # Downgrade user
                        user.is_premium = False
                        
                        # Update subscription status
                        subscription.status = "expired"
                        subscription.updated_at = current_time
                        
                        # Create expiration record
                        expiration_record = PaymentHistory(
                            user_id=user.id,
                            subscription_id=subscription.id,
                            payment_id=f"expire_{uuid.uuid4().hex[:8]}",
                            dodo_subscription_id=subscription.dodo_subscription_id,
                            amount=0.0,
                            currency="USD",
                            status="expired",
                            plan_type="free",
                            billing_cycle="none",
                            payment_completed_at=current_time,
                            verification_completed_at=current_time,
                            notes=f"Subscription expired automatically after {self.grace_period_days}-day grace period",
                            payment_metadata=json.dumps({
                                "action": "automatic_expiration",
                                "original_end_date": make_timezone_aware(subscription.current_period_end).isoformat(),
                                "grace_period_days": self.grace_period_days,
                                "expired_at": current_time.isoformat()
                            })
                        )
                        
                        db.add(expiration_record)
                        expired_count += 1
                        
                        print(f"[OK] User {user.email} downgraded due to expiration")
                        
                except Exception as e:
                    print(f"[ERROR] Error processing expired subscription {subscription.id}: {e}")
                    continue
            
            if expired_count > 0:
                db.commit()
                print(f"[OK] Processed {expired_count} expired subscriptions")
            else:
                print("[OK] No expired subscriptions found")
                
            # Also check for subscriptions expiring soon (for notifications)
            self.check_expiring_soon(db, current_time)
            
        except Exception as e:
            print(f"[ERROR] Error in subscription expiration check: {e}")
            db.rollback()
    
    def check_expiring_soon(self, db: Session, current_time: datetime):
        """Check for subscriptions expiring soon (for notifications)"""
        
        try:
            # Find subscriptions expiring in the next 3 days
            warning_cutoff = current_time + timedelta(days=3)
            
            expiring_soon = db.query(Subscription).filter(
                and_(
                    Subscription.status == "active",
                    Subscription.current_period_end <= warning_cutoff,
                    Subscription.current_period_end > current_time
                )
            ).all()
            
            if expiring_soon:
                print(f"[WARN] Found {len(expiring_soon)} subscriptions expiring within 3 days")
                for subscription in expiring_soon:
                    user = db.query(User).filter(User.id == subscription.user_id).first()
                    if user:
                        end_time = make_timezone_aware(subscription.current_period_end)
                        days_left = (end_time - current_time).days
                        print(f"   {user.email} expires in {days_left} days")
                        # Here you could send email notifications
            
        except Exception as e:
            print(f"[ERROR] Error checking expiring subscriptions: {e}")
    
    def check_user_subscription_status(self, user_id: int, db: Session) -> bool:
        """Real-time check if user should have premium access"""
        
        user = None
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return False
            
            # If user is not marked as premium, they don't have access
            if not user.is_premium:
                return False
            
            # Check if user has an active subscription
            active_subscription = db.query(Subscription).filter(
                and_(
                    Subscription.user_id == user_id,
                    Subscription.status == "active"
                )
            ).first()
            
            if not active_subscription:
                # User marked as premium but no active subscription - downgrade
                print(f"[WARN] User {user.email} marked premium but no active subscription - downgrading")
                user.is_premium = False
                db.commit()
                return False
            
            # Check if subscription is expired (with grace period)
            current_time = get_utc_now()
            grace_cutoff = current_time - timedelta(days=self.grace_period_days)
            
            # Make subscription end time timezone-aware for comparison
            subscription_end = make_timezone_aware(active_subscription.current_period_end)
            
            if subscription_end < grace_cutoff:
                # Subscription expired beyond grace period - downgrade immediately
                print(f"[WARN] User {user.email} subscription expired beyond grace period - downgrading")
                user.is_premium = False
                active_subscription.status = "expired"
                active_subscription.updated_at = current_time
                
                # Create expiration record
                expiration_record = PaymentHistory(
                    user_id=user.id,
                    subscription_id=active_subscription.id,
                    payment_id=f"realtime_expire_{uuid.uuid4().hex[:8]}",
                    dodo_subscription_id=active_subscription.dodo_subscription_id,
                    amount=0.0,
                    currency="USD",
                    status="expired",
                    plan_type="free",
                    billing_cycle="none",
                    payment_completed_at=current_time,
                    verification_completed_at=current_time,
                    notes="Subscription expired - real-time check",
                    payment_metadata=json.dumps({
                        "action": "realtime_expiration",
                        "expired_at": current_time.isoformat()
                    })
                )
                
                db.add(expiration_record)
                db.commit()
                return False
            
            # User has valid premium access
            return True
            
        except Exception as e:
            print(f"[ERROR] Error checking user subscription status for user_id {user_id}: {str(e)}")
            import traceback
            traceback.print_exc()
            return user.is_premium if user else False

# Global subscription manager instance
subscription_manager = SubscriptionManager()

def run_subscription_check():
    """Run subscription expiration check - called by background task"""
    try:
        db = next(get_db())
        subscription_manager.check_expired_subscriptions(db)
    except Exception as e:
        print(f"[ERROR] Error in background subscription check: {e}")
    finally:
        if 'db' in locals():
            db.close()

async def subscription_background_task():
    """Background task that runs subscription checks periodically"""
    
    check_interval = subscription_manager.check_interval_hours * 3600  # Convert to seconds
    
    print(f"[INFO] Starting subscription background task (checking every {subscription_manager.check_interval_hours} hours)")
    
    while True:
        try:
            run_subscription_check()
            await asyncio.sleep(check_interval)
        except Exception as e:
            print(f"[ERROR] Error in subscription background task: {e}")
            await asyncio.sleep(300)  # Wait 5 minutes before retrying