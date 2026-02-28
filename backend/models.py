from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="founder") # founder, recruiter, talent
    hashed_password = Column(String, nullable=True)  # Made nullable for OAuth users
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    is_premium = Column(Boolean, default=False)
    
    # User preferences
    auto_save_enabled = Column(Boolean, default=True)
    email_notifications_enabled = Column(Boolean, default=True)
    
    # Resume upload tracking
    resume_upload_count = Column(Integer, default=0)
    
    # Recruiter Info
    company_info = Column(Text, nullable=True)
    company_location = Column(String, nullable=True)
    company_overview = Column(Text, nullable=True)
    
    # OAuth fields
    google_id = Column(String, unique=True, nullable=True, index=True)
    profile_picture = Column(String, nullable=True)
    auth_provider = Column(String, default="local")  # 'local', 'google'
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    content_generations = relationship("ContentGeneration", back_populates="user")
    usage_stats = relationship("UsageStats", back_populates="user")
    subscriptions = relationship("Subscription", back_populates="user")
    payment_history = relationship("PaymentHistory", back_populates="user")

class ContentGeneration(Base):
    __tablename__ = "content_generations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    original_content = Column(Text, nullable=False)
    content_source = Column(String, nullable=True)  # 'text' or 'url'
    twitter_thread = Column(Text, nullable=True)
    linkedin_post = Column(Text, nullable=True)
    instagram_carousel = Column(Text, nullable=True)
    context = Column(Text, nullable=True)  # JSON string for personalization context
    processing_time = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="content_generations")

class UsageStats(Base):
    __tablename__ = "usage_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # 'generate', 'copy', 'share', etc.
    platform = Column(String, nullable=True)  # 'twitter', 'linkedin', 'instagram'
    extra_data = Column(Text, nullable=True)  # JSON string for additional data
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="usage_stats")

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_type = Column(String, nullable=False)  # 'free', 'pro', 'enterprise'
    billing_cycle = Column(String, nullable=True)  # 'monthly', 'yearly'
    status = Column(String, nullable=False)  # 'active', 'cancelled', 'expired', 'on_hold'
    
    # Payment provider fields
    dodo_subscription_id = Column(String, nullable=True, index=True)
    dodo_customer_id = Column(String, nullable=True)
    dodo_product_id = Column(String, nullable=True)
    
    # Legacy Stripe support (keep for backward compatibility)
    stripe_subscription_id = Column(String, nullable=True)
    
    # Subscription details
    amount = Column(Float, nullable=True)
    currency = Column(String, default="USD")
    current_period_start = Column(DateTime(timezone=True), nullable=True)
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    trial_end = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    extra_metadata = Column(Text, nullable=True)  # JSON string for additional data
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="subscriptions")

class PaymentHistory(Base):
    __tablename__ = "payment_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True)
    
    # Payment identifiers
    payment_id = Column(String, unique=True, index=True, nullable=False)  # Our internal payment ID
    dodo_payment_id = Column(String, nullable=True, index=True)  # Dodo Payments transaction ID
    dodo_session_id = Column(String, nullable=True)  # Dodo checkout session ID
    dodo_subscription_id = Column(String, nullable=True)  # Dodo subscription ID
    dodo_customer_id = Column(String, nullable=True)  # Dodo customer ID
    
    # Transaction details
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    status = Column(String, nullable=False)  # 'pending', 'completed', 'failed', 'refunded', 'cancelled'
    payment_method = Column(String, nullable=True)  # 'card', 'paypal', 'bank_transfer', etc.
    
    # Plan details at time of payment
    plan_type = Column(String, nullable=False)  # 'pro', 'enterprise'
    billing_cycle = Column(String, nullable=False)  # 'monthly', 'yearly'
    
    # Payment flow tracking
    checkout_created_at = Column(DateTime(timezone=True), nullable=True)
    payment_initiated_at = Column(DateTime(timezone=True), nullable=True)
    payment_completed_at = Column(DateTime(timezone=True), nullable=True)
    verification_completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Failure tracking
    failure_reason = Column(String, nullable=True)
    failure_code = Column(String, nullable=True)
    retry_count = Column(Integer, default=0)
    
    # Metadata and notes
    payment_metadata = Column(Text, nullable=True)  # JSON string for additional data
    notes = Column(Text, nullable=True)  # Admin notes
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="payment_history")
    subscription = relationship("Subscription")

class APIKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    key_name = Column(String, nullable=False)
    api_key = Column(String, unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True)
    usage_count = Column(Integer, default=0)
    rate_limit = Column(Integer, default=100)  # requests per hour
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_used = Column(DateTime(timezone=True), nullable=True)

class SavedContent(Base):
    __tablename__ = "saved_content"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    content_type = Column(String, nullable=False)  # 'twitter', 'linkedin', 'instagram'
    content = Column(Text, nullable=False)
    tags = Column(String, nullable=True)  # Comma-separated tags
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class CustomTemplate(Base):
    __tablename__ = "custom_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False)  # 'blog', 'newsletter', 'marketing', 'social', 'other'
    content = Column(Text, nullable=False)
    tags = Column(String, nullable=True)  # Comma-separated tags
    is_public = Column(Boolean, default=False)  # Whether other users can see this template
    usage_count = Column(Integer, default=0)  # How many times this template has been used
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User")

class GuestUsage(Base):
    __tablename__ = "guest_usage"
    
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, nullable=False, index=True)
    user_agent = Column(String, nullable=True)
    browser_fingerprint = Column(String, nullable=True, index=True)
    usage_count = Column(Integer, default=1)
    last_used = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Additional tracking fields to prevent abuse
    session_id = Column(String, nullable=True)
    device_info = Column(Text, nullable=True)  # JSON string with device details

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    summary = Column(Text, nullable=True)
    experience = Column(Text, nullable=True)
    education = Column(Text, nullable=True)
    projects = Column(Text, nullable=True)
    social_links = Column(Text, nullable=True)
    location = Column(String, default="Remote")
    
    # AI & Vibe Engine Fields
    elite_rating = Column(Float, default=0.0)
    elite_tag = Column(String, nullable=True)
    profile_completeness = Column(Float, default=0.0)
    ranking_score = Column(Float, default=0.0)
    raw_resume_text = Column(Text, nullable=True)
    vibe_data = Column(Text, nullable=True)  # JSON formatted AI data
    template_id = Column(String, nullable=True)
    landing_page_data = Column(Text, nullable=True) # Legacy
    
    # Trust System
    trust_score = Column(Float, default=0.0)
    is_verified_trust = Column(Boolean, default=False)
    verification_stage = Column(Integer, default=1) # 1: Seed (0-50), 2: Pillar (51-85), 3: Titan (86-100)
    
    # Social Interactions
    is_public = Column(Boolean, default=True)
    profile_views = Column(Integer, default=0)
    upvote_count = Column(Integer, default=0)
    star_count = Column(Integer, default=0)
    flag_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")

class ProfileInteraction(Base):
    __tablename__ = "profile_interactions"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    interaction_type = Column(String, nullable=False)  # 'upvote', 'star'
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
class ProfileFlag(Base):
    __tablename__ = "profile_flags"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False)
    flagger_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    reason = Column(String, nullable=True)
    status = Column(String, default="pending") # pending, reviewed, resolved
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Skill(Base):
    __tablename__ = "skills"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

class Endorsement(Base):
    __tablename__ = "endorsements"
    
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False, index=True)
    endorser_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # optional convenience relationships (not strictly required)
    candidate = relationship("User", foreign_keys=[candidate_id])
    endorser = relationship("User", foreign_keys=[endorser_id])
    skill = relationship("Skill")

class VibeNote(Base):
    __tablename__ = "vibe_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    vibe_type = Column(String, default="professional") # professional, creative, leadership
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    profile = relationship("Profile", foreign_keys=[profile_id])
    author = relationship("User", foreign_keys=[author_id])

class Rating(Base):
    __tablename__ = "ratings"
    
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Float, nullable=False, default=0.0)


class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(Integer, primary_key=True, index=True)
    recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    company_name = Column(String, nullable=False)
    location = Column(String, nullable=True)
    job_type = Column(String, default="full-time")  # full-time, part-time, contract, internship
    work_mode = Column(String, default="remote")  # remote, hybrid, onsite
    salary_range = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("job_postings.id"), nullable=False, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    cover_letter = Column(Text, nullable=True)
    status = Column(String, default="applied")  # applied, shortlisted, interview, rejected, hired
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
