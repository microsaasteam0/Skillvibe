from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth import get_current_user, get_optional_current_user
from database import get_db
from models import JobApplication, JobPosting, Profile, User
import re

job_router = APIRouter(prefix="/jobs", tags=["Jobs"])

def slugify(text: str) -> str:
    if not text:
        return ""
    text = text.lower().strip()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text)
    return text.strip('-')


class CreateJobRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    company_name: str = Field(..., min_length=2, max_length=200)
    location: Optional[str] = Field(default="Remote", max_length=200)
    job_type: Optional[str] = Field(default="full-time", max_length=50)
    work_mode: Optional[str] = Field(default="remote", max_length=50)
    salary_range: Optional[str] = Field(default=None, pattern=r"^\d{1,9}\s*-\s*\d{1,9}$")
    description: str = Field(..., min_length=20)
    requirements: Optional[str] = Field(default=None)


class UpdateJobRequest(BaseModel):
    is_active: Optional[bool] = None


class ApplyRequest(BaseModel):
    cover_letter: Optional[str] = None


class UpdateApplicationStatusRequest(BaseModel):
    status: str = Field(..., pattern="^(applied|shortlisted|interview|rejected|hired)$")

class UpdateCompanyProfileRequest(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=200)
    location: Optional[str] = Field(default="Remote", max_length=200)
    overview: Optional[str] = Field(default=None, min_length=20, max_length=3000)


def _serialize_job(job: JobPosting, db: Session, current_user_id: Optional[int] = None):
    recruiter = db.query(User).filter(User.id == job.recruiter_id).first()
    recruiter_profile = db.query(Profile).filter(Profile.user_id == job.recruiter_id).first()
    application_count = db.query(JobApplication).filter(JobApplication.job_id == job.id).count()
    has_applied = False
    if current_user_id:
        has_applied = (
            db.query(JobApplication)
            .filter(
                JobApplication.job_id == job.id,
                JobApplication.candidate_id == current_user_id
            )
            .first()
            is not None
        )

    return {
        "id": job.id,
        "title": job.title,
        "company_name": job.company_name,
        "location": job.location,
        "job_type": job.job_type,
        "work_mode": job.work_mode,
        "salary_range": job.salary_range,
        "description": job.description,
        "requirements": job.requirements,
        "is_active": job.is_active,
        "created_at": job.created_at,
        "updated_at": job.updated_at,
        "posted_by": {
            "id": recruiter.id if recruiter else None,
            "username": recruiter.username if recruiter else None,
            "full_name": recruiter.full_name if recruiter else None,
            "slug": recruiter_profile.slug if recruiter_profile else None,
        },
        "application_count": application_count,
        "has_applied": has_applied,
    }


@job_router.post("")
async def create_job_posting(
    payload: CreateJobRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=403, detail="Only recruiters can post jobs")

    job = JobPosting(
        recruiter_id=current_user.id,
        title=payload.title.strip(),
        company_name=payload.company_name.strip(),
        location=(payload.location or "Remote").strip(),
        job_type=(payload.job_type or "full-time").strip().lower(),
        work_mode=(payload.work_mode or "remote").strip().lower(),
        salary_range=(payload.salary_range or "").strip() or None,
        description=payload.description.strip(),
        requirements=(payload.requirements or "").strip() or None,
        is_active=True,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return {"message": "Job posted successfully", "job": _serialize_job(job, db)}


@job_router.get("")
async def list_jobs(
    q: Optional[str] = Query(default=None),
    location: Optional[str] = Query(default=None),
    work_mode: Optional[str] = Query(default=None),
    job_type: Optional[str] = Query(default=None),
    limit: int = Query(default=30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    query = db.query(JobPosting).filter(JobPosting.is_active == True)  # noqa: E712

    if q:
        q_value = f"%{q.strip()}%"
        query = query.filter(
            (JobPosting.title.ilike(q_value))
            | (JobPosting.company_name.ilike(q_value))
            | (JobPosting.description.ilike(q_value))
        )
    if location:
        query = query.filter(JobPosting.location.ilike(f"%{location.strip()}%"))
    if work_mode:
        query = query.filter(JobPosting.work_mode == work_mode.strip().lower())
    if job_type:
        query = query.filter(JobPosting.job_type == job_type.strip().lower())

    jobs = query.order_by(JobPosting.created_at.desc()).limit(limit).all()
    current_user_id = current_user.id if current_user else None
    return [_serialize_job(job, db, current_user_id) for job in jobs]


@job_router.get("/recruiter/me")
async def my_recruiter_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=403, detail="Only recruiters can access this")

    jobs = (
        db.query(JobPosting)
        .filter(JobPosting.recruiter_id == current_user.id)
        .order_by(JobPosting.created_at.desc())
        .all()
    )
    return [_serialize_job(job, db) for job in jobs]


@job_router.get("/recruiter/{recruiter_id}/company")
async def recruiter_company_profile(
    recruiter_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    recruiter = None
    if recruiter_id.isdigit():
        recruiter = db.query(User).filter(User.id == int(recruiter_id)).first()

    # Prioritize the current user if they match the requested slug (prevents collision lockouts)
    if not recruiter and current_user and current_user.role == "recruiter":
        if slugify(current_user.company_info or current_user.full_name or "") == recruiter_id:
            recruiter = current_user
    
    # If not found by ID or passing a slug, try to find recruiter by company slug
    if not recruiter:
        recruiters = db.query(User).filter(User.role == "recruiter").all()
        for r in recruiters:
            if slugify(r.company_info or r.full_name or "") == recruiter_id:
                recruiter = r
                break
                
    if not recruiter:
        # Fallback to checking job postings just in case
        jobs_all = db.query(JobPosting).filter(JobPosting.is_active == True).all()
        for j in jobs_all:
            if slugify(j.company_name or "") == recruiter_id:
                recruiter = db.query(User).filter(User.id == j.recruiter_id).first()
                break

    if not recruiter:
        raise HTTPException(status_code=404, detail="Recruiter or company not found")

    jobs = (
        db.query(JobPosting)
        .filter(JobPosting.recruiter_id == recruiter.id)
        .order_by(JobPosting.created_at.desc())
        .all()
    )
    # Removed the 404 if not jobs constraint so new recruiters can view their profile outline
    company_name = recruiter.company_info or (recruiter.full_name + "'s Company" if recruiter.full_name else "Unknown Company")
    company_location = recruiter.company_location or "Remote"
    company_overview = recruiter.company_overview or ""

    if jobs:
        latest_job = jobs[0]
        # Prefer the explicitly named company from the job if company_info wasn't directly found, or use as fallback
        if not recruiter.company_info and latest_job.company_name:
            company_name = latest_job.company_name
            
        if not recruiter.company_location and latest_job.location:
             company_location = latest_job.location
             
        # Use latest job description as company overview fallback.
        if not recruiter.company_overview and latest_job.description:
             fallback_overview = (latest_job.description or "").strip()
             if len(fallback_overview) > 800:
                  fallback_overview = fallback_overview[:800].rstrip() + "..."
             company_overview = fallback_overview

    # Keep response light and fast; avoid expensive per-job aggregate queries.
    open_jobs = [
        {
            "id": job.id,
            "title": job.title,
            "company_name": job.company_name,
            "location": job.location,
            "job_type": job.job_type,
            "work_mode": job.work_mode,
            "salary_range": job.salary_range,
            "is_active": job.is_active,
            "created_at": job.created_at,
            "description": job.description,
            "requirements": job.requirements,
        }
        for job in jobs
        if job.is_active
    ]

    return {
        "recruiter": {
            "id": recruiter.id,
            "username": recruiter.username,
            "full_name": recruiter.full_name,
            "profile_picture": recruiter.profile_picture,
        },
        "company": {
            "name": company_name,
            "location": company_location,
            "overview": company_overview,
            "total_jobs": len(jobs),
            "open_jobs_count": len(open_jobs),
        },
        "open_jobs": open_jobs,
    }


@job_router.put("/recruiter/company")
@job_router.put("/recruiter/{recruiter_id}/company")
async def update_recruiter_company_profile(
    payload: UpdateCompanyProfileRequest,
    recruiter_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=403, detail="Only recruiters can update company profile")

    # Resolve target recruiter
    target_recruiter = None
    if recruiter_id is not None:
        if recruiter_id.isdigit():
            target_recruiter = db.query(User).filter(User.id == int(recruiter_id)).first()
        else:
            recruiters = db.query(User).filter(User.role == "recruiter").all()
            for r in recruiters:
                if slugify(r.company_info or r.full_name or "") == recruiter_id:
                    target_recruiter = r
                    break
        if not target_recruiter:
            raise HTTPException(status_code=404, detail="Recruiter not found")
    else:
        target_recruiter = current_user

    # If route includes recruiter_id, enforce ownership (unless admin).
    if recruiter_id is not None and current_user.role != "admin" and target_recruiter.id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own company profile")

    jobs = (
        db.query(JobPosting)
        .filter(JobPosting.recruiter_id == target_recruiter.id)
        .order_by(JobPosting.created_at.desc())
        .all()
    )
    company_name = payload.company_name.strip()
    location = (payload.location or "Remote").strip()
    overview = (payload.overview or "").strip()
    
    if target_recruiter.company_info and company_name != target_recruiter.company_info:
        raise HTTPException(status_code=400, detail="Company name cannot be changed once established to maintain URL identity")
    
    # Enforce uniqueness of company info slug
    if company_name:
        new_slug = slugify(company_name)
        existing_recruiters = db.query(User).filter(User.role == "recruiter", User.id != target_recruiter.id).all()
        for r in existing_recruiters:
            if slugify(r.company_info or "") == new_slug:
                raise HTTPException(status_code=400, detail="This company name is already taken by another recruiter")

    # Save the updated profile info to the user
    target_recruiter.company_info = company_name
    target_recruiter.company_location = location
    target_recruiter.company_overview = overview

    # Keep company fields consistent across any existing recruiter jobs.
    for job in jobs:
        job.company_name = company_name
        job.location = location

    # Don't clobber the latest job description with the company overview, they are now separate.

    db.commit()

    return {
        "message": "Company profile updated",
        "company": {
            "name": company_name,
            "location": location,
            "overview": overview,
            "total_jobs": len(jobs),
            "open_jobs_count": len([j for j in jobs if j.is_active]),
        },
    }


@job_router.patch("/{job_id}")
async def update_job(
    job_id: int,
    payload: UpdateJobRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if current_user.role != "admin" and job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own jobs")

    if payload.is_active is not None:
        job.is_active = payload.is_active

    db.commit()
    db.refresh(job)
    return {"message": "Job updated", "job": _serialize_job(job, db)}


@job_router.post("/{job_id}/apply")
async def apply_to_job(
    job_id: int,
    payload: ApplyRequest = Body(default=ApplyRequest()),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["candidate", "admin"]:
        raise HTTPException(status_code=403, detail="Only candidates can apply")

    # Require a resume-based candidate profile before allowing job applications.
    candidate_profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    has_resume_profile = bool(
        candidate_profile
        and candidate_profile.raw_resume_text
        and candidate_profile.raw_resume_text.strip()
    )
    if not has_resume_profile:
        raise HTTPException(
            status_code=400,
            detail="Please create your profile by uploading your resume before applying to jobs."
        )

    job = db.query(JobPosting).filter(JobPosting.id == job_id, JobPosting.is_active == True).first()  # noqa: E712
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or not active")

    if job.recruiter_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot apply to your own job")

    existing = (
        db.query(JobApplication)
        .filter(JobApplication.job_id == job_id, JobApplication.candidate_id == current_user.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied to this job")

    application = JobApplication(
        job_id=job_id,
        candidate_id=current_user.id,
        cover_letter=(payload.cover_letter or "").strip() or None,
        status="applied",
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return {"message": "Application submitted", "application_id": application.id, "status": application.status}


@job_router.get("/candidate/me")
async def my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["candidate", "admin"]:
        raise HTTPException(status_code=403, detail="Only candidates can access this")

    applications = (
        db.query(JobApplication)
        .filter(JobApplication.candidate_id == current_user.id)
        .order_by(JobApplication.created_at.desc())
        .all()
    )
    items = []
    for app in applications:
        job = db.query(JobPosting).filter(JobPosting.id == app.job_id).first()
        if not job:
            continue
        items.append({
            "application_id": app.id,
            "status": app.status,
            "cover_letter": app.cover_letter,
            "created_at": app.created_at,
            "job": _serialize_job(job, db, current_user.id)
        })
    return items


@job_router.get("/{job_id}/applications")
async def list_job_applications(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if current_user.role != "admin" and job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only view applications for your jobs")

    applications = (
        db.query(JobApplication)
        .filter(JobApplication.job_id == job_id)
        .order_by(JobApplication.created_at.desc())
        .all()
    )
    output = []
    for app in applications:
        candidate = db.query(User).filter(User.id == app.candidate_id).first()
        candidate_profile = db.query(Profile).filter(Profile.user_id == app.candidate_id).first()
        output.append({
            "application_id": app.id,
            "status": app.status,
            "cover_letter": app.cover_letter,
            "created_at": app.created_at,
            "candidate": {
                "id": candidate.id if candidate else None,
                "username": candidate.username if candidate else None,
                "full_name": candidate.full_name if candidate else None,
                "email": candidate.email if candidate else None,
                "profile_picture": candidate.profile_picture if candidate else None,
                "slug": candidate_profile.slug if candidate_profile else None,
            },
        })
    return output


@job_router.patch("/applications/{application_id}/status")
async def update_application_status(
    application_id: int,
    payload: UpdateApplicationStatusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    job = db.query(JobPosting).filter(JobPosting.id == application.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if current_user.role != "admin" and job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update applications for your jobs")

    application.status = payload.status
    db.commit()
    db.refresh(application)
    return {"message": "Application status updated", "application_id": application.id, "status": application.status}
