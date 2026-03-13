import os
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, and_

from auth import get_current_user
from database import get_db
from models import Profile, User, Skill, Endorsement, Conversation, Message
from routes.skillvibe_routes import call_pollinations_with_fallback
import json
import uuid
from email_service import email_service

job_router = APIRouter(prefix="/jobs", tags=["Scout"])

class ScoutRequest(BaseModel):
    prompt: str = Field(..., description="Details about the freelance role", min_length=3)
    min_trust_score: Optional[float] = Field(default=0.0)
    min_elite_rating: Optional[float] = Field(default=0.0)
    location: Optional[str] = None
    category: Optional[str] = None
    experience: Optional[str] = None
    region: Optional[str] = None
    freelance_only: Optional[bool] = Field(default=True)
    limit: Optional[int] = Field(default=10, le=50)

class CandidateResponse(BaseModel):
    id: int
    user_id: int
    slug: str
    username: str
    full_name: Optional[str]
    headline: Optional[str]
    trust_score: float
    elite_rating: float
    location: Optional[str]
    profile_picture: Optional[str] = None
    summary: Optional[str]
    match_reason: str
    match_score: int

@job_router.post("/scout", response_model=List[CandidateResponse])
async def scout_candidates(
    payload: ScoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Scouts the top candidates based on the recruiter's specific prompt using AI.
    """
    if current_user.role != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can access the Scout AI.")

    # Get profiles for context
    print(f"[DEBUG] Scouting with filters: {payload.dict()}")
    
    # Base query for all candidates
    base_query = db.query(Profile).join(User).filter(User.role == "candidate")
    
    # Apply hard filters ONLY if pool is large, otherwise let AI handle the nuance
    # For now, let's keep it AI-first by fetching a broad set
    profiles = base_query.all()
    
    if not profiles:
        print("[DEBUG] No profiles found in database at all.")
        return []

    print(f"[DEBUG] Found {len(profiles)} total candidates to consider.")

    candidate_context = []
    for p in profiles:
        candidate_context.append({
            "id": p.user_id,
            "name": p.user.full_name or p.user.username,
            "summary": p.summary,
            "trust_score": p.trust_score,
            "skills": p.projects,
            "category": p.category,
            "experience_level": p.experience_level,
            "region": p.region
        })

    try:
        # Enforce free tier candidate limits
        if not current_user.is_premium:
            candidate_limit = min(payload.limit or 3, 3)
        else:
            candidate_limit = payload.limit or 10
            
        system_msg = f"""
        You are an AI Talent Headhunter. Match candidates to the recruiter's specific requirements.
        
        STRICT DOMAIN MATCHING RULES:
        1. Only return candidates that are a valid professional match for the requested role.
        2. DO NOT match across domains. If looking for a "Mechanical Engineer" but you only have "Software/AI" profiles, return NO MATCHES.
        3. "Python" or "DBMS" skills do NOT justify a match for non-programmatic roles (e.g. Civil, Mechanical, Medical) unless the prompt explicitly asks for "Software for Mechanical Engineering".
        4. If a candidate is even slightly irrelevant, exclude them.
        
        Return a JSON object with 'matches': list of {{id: int, reason: str, score: int}} for up to the top {candidate_limit} fits.
        If no one fits, return: {{"matches": []}}.
        The score (0-100) must reflect the PERFECT fit. A match with < 60 score should be excluded.
        Output ONLY RAW JSON.
        """
        requirements = {
            "role_description": payload.prompt,
            "category": payload.category,
            "min_experience_level": payload.experience,
            "preferred_region": payload.region,
            "min_trust_score": (float(payload.min_trust_score) * 20) if payload.min_trust_score else 0.0,
            "min_prowess_score": payload.min_elite_rating,
            "limit": candidate_limit
        }
        user_msg = f"Requirements: {json.dumps(requirements)}\nCandidates: {json.dumps(candidate_context)}"
        raw_result = await call_pollinations_with_fallback(system_msg, user_msg)
        print(f"[DEBUG] Raw AI Scout Response: {raw_result}")
        
        result_content = raw_result.replace("```json", "").replace("```", "").strip()
        result = json.loads(result_content)
        
        matches_data = [m for m in result.get("matches", []) if m.get("score", 0) >= 50]
        matched_ids = [m.get("id") for m in matches_data]
        reasons_map = {m.get("id"): m.get("reason") for m in matches_data}
        scores_map = {m.get("id"): m.get("score", 0) for m in matches_data}
    except Exception as e:
        print(f"[ERROR] AI Scout matching failed: {str(e)}")
        # If AI fails, we return an empty list rather than irrelevant "top" candidates
        matched_ids = []
        reasons_map = {}
        scores_map = {}

    # Filter from the already-fetched list in memory to avoid "SSL connection closed" 
    # errors that occur when the DB connection idles during a long AI await.
    final_profiles = [p for p in profiles if p.user_id in matched_ids]
    
    # Sort by the order AI returned
    final_profiles_sorted = sorted(final_profiles, key=lambda p: matched_ids.index(p.user_id) if p.user_id in matched_ids else 999)

    candidates = []
    for profile in final_profiles_sorted:
        if profile.user_id not in matched_ids: continue
        candidates.append(CandidateResponse(
            id=profile.id,
            user_id=profile.user_id,
            slug=profile.slug,
            username=profile.user.username,
            full_name=profile.user.full_name,
            headline=profile.summary[:70] + "..." if profile.summary else "Elite Talent",
            trust_score=profile.trust_score,
            elite_rating=profile.elite_rating,
            location=profile.location,
            profile_picture=profile.user.profile_picture,
            summary=profile.summary,
            match_reason=reasons_map.get(profile.user_id, "High alignment with your requirements."),
            match_score=scores_map.get(profile.user_id, int(profile.trust_score))
        ))

    return candidates

class OutreachRequest(BaseModel):
    candidate_ids: List[int]
    message: str = Field(..., min_length=10)

@job_router.post("/scout/outreach")
def send_outreach(
    payload: OutreachRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sends outreach emails to one or more scouted candidates.
    """
    if current_user.role != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can send outreach.")

    if not payload.candidate_ids:
        raise HTTPException(status_code=400, detail="No candidates selected.")

    # Enforce free tier outreach limits (max 3 lifetime conversations)
    if not current_user.is_premium:
        current_outreach = db.query(Conversation).filter(Conversation.recruiter_id == current_user.id).count()
        if current_outreach + len(payload.candidate_ids) > 3:
            raise HTTPException(
                status_code=403,
                detail=f"Free Tier Limit Reached ({current_outreach}/3 connections used). Upgrade to Pillar Elite for unlimited talent outreach."
            )

    # Fetch all valid candidates in one query
    target_users = db.query(User).filter(
        User.id.in_(payload.candidate_ids),
        User.role == "candidate"
    ).all()

    if not target_users:
        raise HTTPException(status_code=404, detail="No valid candidates found.")

    # Perform the outreach
    success_count = 0
    failed_candidates = []
    
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

    for target in target_users:
        # Strip trailing slash to avoid double slashes in the link
        base_url = frontend_url.rstrip('/')
        print(f"[OUTREACH] Creating Connection: {current_user.email} -> {target.email}")
        
        try:
            # 1. Start a Conversation on SkillVibe
            # Check if exists
            conv = db.query(Conversation).filter(
                Conversation.recruiter_id == current_user.id,
                Conversation.candidate_id == target.id
            ).first()
            
            if not conv:
                conv = Conversation(
                    chat_id=f"sv_{uuid.uuid4().hex[:12]}",
                    recruiter_id=current_user.id,
                    candidate_id=target.id,
                    last_message=payload.message[:100]
                )
                db.add(conv)
                db.flush()
            
            # 2. Add the Initial Message
            new_msg = Message(
                conversation_id=conv.id,
                sender_id=current_user.id,
                content=payload.message
            )
            db.add(new_msg)
            db.commit()
            
            # 3. Send "Innovative" Email with App Link
            connection_url = f"{base_url}/messages/{conv.chat_id}"
            
            sent = email_service.send_recruiter_contact_email(
                to_email=target.email,
                candidate_name=target.full_name or target.username,
                recruiter_name=current_user.full_name or current_user.username,
                recruiter_email=current_user.email,
                recruiter_company=current_user.company_info,
                subject="New SkillVibe Connection Request",
                message=payload.message,
                action_url=connection_url
            )
            
            if sent:
                success_count += 1
                print(f"[OUTREACH] Success for {target.email}")
            else:
                failed_candidates.append(target.email)
                print(f"[OUTREACH] Email failed for {target.email}")
                
        except Exception as e:
            db.rollback()
            failed_candidates.append(target.email)
            print(f"[OUTREACH] Exception for {target.email}: {str(e)}")

    msg = f"Successfully initiated {success_count} elite connections!"
    if failed_candidates:
        msg += f" (System issue with: {', '.join(failed_candidates)})"

    return {
        "status": "success", 
        "message": msg,
        "success_count": success_count,
        "failed_count": len(failed_candidates)
    }
