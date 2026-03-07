from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from typing import List, Optional
import json
import uuid
import os
from datetime import datetime, timedelta, timezone
import random

from database import get_db
from models import User, Profile, Skill, Endorsement, Rating, ProfileFlag, ProfileInteraction, VibeNote
from auth import get_current_user, get_optional_current_user
from openai import OpenAI
import httpx

skillvibe_router = APIRouter(prefix="/skillvibe", tags=["SkillVibe"])

from pypdf import PdfReader
import io
from docx import Document


def clean_social_link(link, platform=None):
    print(f"[DEBUG] Cleaning link: '{link}' for platform: {platform}")
    if not link or link == "#": return "#"
    
    # Remove junk like Markdown formatting or parentheses
    link = str(link).strip().strip('()[]*')
    # Remove trailing punctuation often captured from resumes
    link = link.rstrip('.,;:')
    
    # Handle "LinkedIn: " prefix
    if ":" in link and not link.startswith("http"):
        link = link.split(":")[-1].strip()
    
    # Platform specific normalization
    lower_link = link.lower()
    if platform == "linkedin" and "linkedin.com" not in lower_link:
        if "/" not in link: result = f"https://linkedin.com/in/{link}"
        else: result = f"https://linkedin.com/{link}"
        print(f"[DEBUG] Prepped LinkedIn: {result}")
        return result
    if platform == "github" and "github.com" not in lower_link:
        if "/" not in link: result = f"https://github.com/{link}"
        else: result = f"https://github.com/{link}"
        print(f"[DEBUG] Prepped GitHub: {result}")
        return result
    
    if not link.startswith("http") and "." in link:
        result = f"https://{link}"
        print(f"[DEBUG] Prepped Link (domain only): {result}")
        return result
    
    return link

def get_pollinations_client():
    """Return a Pollinations-compatible OpenAI client (same API the rest of the app uses)"""
    api_key = os.getenv("POLLINATIONS_API_KEY")
    if not api_key:
        raise Exception("POLLINATIONS_API_KEY missing in environment")
    # Fast timeout for scout responses
    http_client = httpx.Client(timeout=30, verify=False)
    return OpenAI(
        api_key=api_key,
        base_url="https://gen.pollinations.ai/v1",
        http_client=http_client
    )

async def call_pollinations_with_fallback(system_prompt: str, user_prompt: str, max_tokens: int = 1500, preferred_models: list = None):
    """Call Pollinations with multiple model fallbacks for robustness"""
    client = get_pollinations_client()
    
    # Default rotation if none provided - including 'openai' and 'gemini' for reliability
    if not preferred_models:
        preferred_models = ["openai", "mistral", "qwen-coder", "gemini", "grok"]
    
    last_error = None
    for model in preferred_models:
        # Retry each model if it returns junk
        for attempt in range(2):
            try:
                print(f"[DEBUG] Attempting AI call with model: {model} (Attempt {attempt+1})")
                response = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    max_tokens=max_tokens
                )
                content = response.choices[0].message.content.strip()
                
                # Diagnostic: What is actually coming back?
                preview = content[:100].replace('\n', ' ')
                
                # Robustness Check
                content_lower = content.lower()
                is_junk = (
                    not content or 
                    (len(content) < 15 and "{" not in content) or 
                    "rate limit" in content_lower or 
                    "internal server error" in content_lower or
                    "model not found" in content_lower or
                    "error" in content_lower[:50] or
                    "bad gateway" in content_lower
                )
                
                if not is_junk:
                    print(f"[DEBUG] AI Success with model: {model}")
                    return content
                else:
                    print(f"[WARN] AI Junk detected from {model}: '{preview}...'")
                    last_error = Exception(f"Junk response from {model}")
            except Exception as e:
                print(f"[WARN] AI call failed for model {model} attempt {attempt+1}: {e}")
                last_error = e
                import time
                time.sleep(1)
        
    raise last_error or Exception("OpenAI-style models failed after multiple attempts.")

@skillvibe_router.post("/resume-upload")
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check resume upload limit for non-premium users
    if not current_user.is_premium:
        resume_limit = 2
        if current_user.resume_upload_count >= resume_limit:
            raise HTTPException(
                status_code=403,
                detail=f"Resume upload limit reached ({resume_limit}). Upgrade to Pillar Elite for unlimited uploads."
            )
    
    # Extract text based on file type
    extracted_text = ""
    contents = await file.read()
    file_extension = file.filename.split('.')[-1].lower()
    
    try:
        if file_extension == 'pdf':
            reader = PdfReader(io.BytesIO(contents))
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
            
            # Extract embedded links (hyperlinks on text, common in Canva)
            try:
                embedded_links = []
                for page in reader.pages:
                    if "/Annots" in page:
                        for annot in page["/Annots"]:
                            obj = annot.get_object()
                            if obj and "/A" in obj and "/URI" in obj["/A"]:
                                uri = obj["/A"]["/URI"]
                                embedded_links.append(uri)
                if embedded_links:
                    print(f"[DEBUG] Found {len(embedded_links)} embedded hyperlinks in PDF: {embedded_links}")
                    extracted_text += "\n[Hyperlinks Detected]: " + ", ".join(embedded_links)
            except Exception as e:
                print(f"[WARN] Failed to extract PDF annotations: {e}")
        elif file_extension in ['docx', 'doc']:
            doc = Document(io.BytesIO(contents))
            for para in doc.paragraphs:
                extracted_text += para.text + "\n"
        else:
            extracted_text = contents.decode('utf-8', errors='ignore')
            
        # ── TEXT NORMALIZATION (Fix spaced-out text like "M o h i t  S h a r m a") ──
        import re
        # Remove multiple spaces between characters while preserving single spaces between words
        # This fixes "M o h i t   S h a r m a" into "Mohit Sharma"
        def normalize_spaced_text(text):
            if not text: return ""
            # Fix spaced-out text: Join sequences of 3+ single characters separated by spaces
            # Example: "M o h i t" -> "Mohit" | Avoids "AI Specialist"
            text = re.sub(r'(?:^|(?<=\s))(\w\s){2,}\w(?=\s|$)', lambda m: m.group(0).replace(' ', ''), text)
            
            # Standardize whitespace
            text = re.sub(r'[ \t]+', ' ', text)
            return text.strip()
            
        extracted_text = normalize_spaced_text(extracted_text)

    except Exception as e:
        print(f"[ERROR] Extraction error: {e}")
        extracted_text = ""

    print(f"[DEBUG] Extracted text length: {len(extracted_text)}")
    
    # ── SOCIAL LINK DISCOVERY (Regex Discovery) ──
    import re
    # Broad patterns to catch various formats
    raw_li = re.findall(r'linkedin\.com/in/([a-zA-Z0-9\-\._/]+)', extracted_text, re.I)
    raw_gh = re.findall(r'github\.com/([a-zA-Z0-9\-\._/]+)', extracted_text, re.I)
    raw_portfolio = re.findall(r'(?:portfolio|website|web|link):?\s*(https?://[^\s,]+)', extracted_text, re.I)
    
    # Clean up results (remove duplicates and trailing slashes)
    discovered_li = list(set([l.rstrip('/') for l in raw_li if l]))
    discovered_gh = list(set([l.rstrip('/') for l in raw_gh if l]))
    discovered_pf = list(set([p.strip() for p in raw_portfolio if p]))

    print(f"[DEBUG] Regex Discovery - LI: {discovered_li}, GH: {discovered_gh}, PF: {discovered_pf}")

    if len(extracted_text) > 0:
        print(f"[DEBUG] Text Preview: {extracted_text[:400]}...")
    
    if not extracted_text.strip():
        print("[WARN] Empty extraction, using basic profile info")
        extracted_text = f"User: {current_user.full_name or current_user.username}\nExperienced Professional with a focus on modern tech stacks."
    
    # ── STEP 1: Fast-track JSON Extraction (For Database/Profile) ──
    try:
        print("[DEBUG] Extracting structured data for db...")
        text_for_ai = extracted_text[:12000]
        hint_links = f"""HINT: Strictly use these discovered links if applicable:
- LinkedIn: {discovered_li}
- GitHub: {discovered_gh}
- Portfolio: {discovered_pf}"""
        system_msg = """
        You are a Cutthroat Executive Headhunter and Integrity Auditor. 
        Extract the resume into JSON while being EXTREMELY CRITICAL of their "Elite" status.
        
        REQUIRED FIELDS:
        - "full_name": string
        - "headline": string
        - "about": string
        - "skills": list
        - "experience": list
        - "social_links": object
        
        - "elite_rating": number (A score from 0-100. BE BRUTAL.)
          SCORING RUBRIC:
          - 90-100: "Industry Titan" (Worked at Google/OpenAI/Top-tier firms AND has complex, rare technical achievements).
          - 75-89: "Strategic Architect" (Senior level, proven impact in mid-to-large firms).
          - 50-74: "Rising Specialist" (Junior/Mid with potential but limited high-stakes proof).
          - <50: "Junior Talent" (Entry level or vague experience).
          - DEDUCT 10 points for: Generic summaries, buzzword-overload without project proof, or career gaps.
        
        - "elite_tag": string (Matching the rubric above)
        
        - "integrity_scan": {
            "score": number (0.0 to 1.0),
            "is_potentially_ai_generated": boolean,
            "anomalies": list,
            "verdict": string
          }
        
        CRITICAL RULES:
        1. RIGOROUS RATING: Most resumes should fall between 30-55. 
           - Do NOT give 60+ unless they have substantial experience at recognizable firms.
           - Do NOT give 80+ unless they are a certified industry leader (Principal/Founder level).
        2. DEDUCT 15 points for: Generic summaries, buzzword-overload without project proof, or career gaps.
        3. INTEGRITY SCORE: If the resume sounds like it was written by ChatGPT or is too "flowery," set is_potentially_ai_generated to true and drop the rating by 15.
        4. Output ONLY raw JSON.
        5. PENALIZE (up to -20) if no quantified metrics are provided (e.g. no revenue, no user growth, no system specs).
        """
        raw_json = await call_pollinations_with_fallback(system_msg, f"{hint_links}\n\nRESUME CONTENT:\n{text_for_ai}")
        
        if "```" in raw_json:
            parts = raw_json.split("```")
            for part in parts:
                if "{" in part and "}" in part:
                    raw_json = part.replace("json", "", 1).strip()
                    break
        parsed_data = json.loads(raw_json)
        # Store integrity data in profile later
        integrity_data = parsed_data.get("integrity_scan", {})
    except Exception as e:
        import re
        # Look for links in the original extracted text for better context
        li_patterns = [
            r'linkedin\.com/in/([a-zA-Z0-9-._/]+)',
            r'linkedin\.com/([a-zA-Z0-9-._/]+)',
        ]
        gh_patterns = [
            r'github\.com/([a-zA-Z0-9-._/]+)',
        ]
        
        li = "#"
        for p in li_patterns:
            m = re.search(p, extracted_text, re.I)
            if m:
                li = clean_social_link(m.group(0), "linkedin")
                break
        
        gh = "#"
        for p in gh_patterns:
            m = re.search(p, extracted_text, re.I)
            if m:
                gh = clean_social_link(m.group(0), "github")
                break

        # Backup email recovery
        email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', extracted_text)
        email = email_match.group(0) if email_match else current_user.email
        
        parsed_data = {
            "full_name": current_user.full_name or current_user.username,
            "headline": "Professional Talent",
            "elite_rating": 45.0,
            "elite_tag": "Rising Specialist",
            "about": "Aspiring professional with a focus on modern industry practices.",
            "social_links": {
                "linkedin": li,
                "github": gh,
                "portfolio": "#"
            },
            "skills": ["Professional Communication", "Problem Solving"],
            "experience": [],
            "education": [],
            "integrity_scan": {"score": 0.5, "verdict": "Fallback used due to extraction delay."}
        }
        integrity_data = parsed_data["integrity_scan"]

    # Ensure social links are clean
    links = parsed_data.get("social_links", {})
    print(f"[DEBUG] Raw social links from AI: {links}")
    
    if isinstance(links, dict):
        # Manual Override: If AI failed but Regex/PDF found them, inject them
        if (not links.get("linkedin") or links.get("linkedin") == "#") and discovered_li:
            print(f"[DEBUG] Injecting discovered LinkedIn: {discovered_li[0]}")
            links["linkedin"] = discovered_li[0]
            
        if (not links.get("github") or links.get("github") == "#") and discovered_gh:
            print(f"[DEBUG] Injecting discovered GitHub: {discovered_gh[0]}")
            links["github"] = discovered_gh[0]
            
        if (not links.get("portfolio") or links.get("portfolio") == "#") and discovered_pf:
            print(f"[DEBUG] Injecting discovered Portfolio: {discovered_pf[0]}")
            links["portfolio"] = discovered_pf[0]

        # Clean all links
        links["linkedin"] = clean_social_link(links.get("linkedin"), "linkedin")
        links["github"] = clean_social_link(links.get("github"), "github")
        links["portfolio"] = clean_social_link(links.get("portfolio"), "portfolio")
        parsed_data["social_links"] = links
    
    print(f"[DEBUG] Final social links: {parsed_data['social_links']}")

    # Update user's full name if extracted
    ai_name = parsed_data.get("full_name")
    if ai_name and (not current_user.full_name or current_user.full_name == current_user.username):
        current_user.full_name = ai_name
    
    # Create or update profile
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        import uuid
        target_slug = f"{current_user.username.lower()}-{str(uuid.uuid4())[:8]}"
        profile = Profile(
            user_id=current_user.id,
            slug=target_slug,
            summary=parsed_data.get("about", ""),
            experience=json.dumps(parsed_data.get("experience", [])),
            education=json.dumps(parsed_data.get("education", [])),
            projects=json.dumps(parsed_data.get("skills", [])),
            social_links=json.dumps(parsed_data.get("social_links", {})),
            location=parsed_data.get("location", "Remote"),
            elite_rating=parsed_data.get("elite_rating", 45.0),
            elite_tag=parsed_data.get("elite_tag", "Rising Specialist"),
            profile_completeness=1.0,
            ranking_score=parsed_data.get("elite_rating", 45.0),
            raw_resume_text=extracted_text,
            vibe_data=json.dumps({"integrity": integrity_data}),
            # Initial trust calc
            trust_score=0.0,
            is_verified_trust=False
        )
        db.add(profile)
        db.flush() # Get ID for trust calc
        
        # Calculate initial trust
        t_score, verified, stage = calculate_trust_logic(profile, db)
        profile.trust_score = t_score
        profile.is_verified_trust = verified
        profile.verification_stage = stage
    else:
        profile.summary = parsed_data.get("about", "")
        profile.experience = json.dumps(parsed_data.get("experience", []))
        profile.education = json.dumps(parsed_data.get("education", []))
        profile.projects = json.dumps(parsed_data.get("skills", []))
        profile.social_links = json.dumps(parsed_data.get("social_links", {}))
        profile.location = parsed_data.get("location", "Remote")
        profile.elite_rating = parsed_data.get("elite_rating", profile.elite_rating)
        profile.elite_tag = parsed_data.get("elite_tag", parsed_data.get("headline", profile.elite_tag))
        profile.profile_completeness = 1.0
        profile.raw_resume_text = extracted_text
        
        # Preserve existing vibe_data but update integrity
        try:
            current_vibe = json.loads(profile.vibe_data) if profile.vibe_data else {}
            current_vibe["integrity"] = integrity_data
            profile.vibe_data = json.dumps(current_vibe)
        except:
            profile.vibe_data = json.dumps({"integrity": integrity_data})
        
        # Recalculate Trust
        t_score, verified, stage = calculate_trust_logic(profile, db)
        profile.trust_score = t_score
        profile.is_verified_trust = verified
        profile.verification_stage = stage
    
    # Increment resume upload counter
    current_user.resume_upload_count += 1
    
    db.commit()
    db.refresh(profile)
    
    # Trigger ranking update
    update_ranking(current_user.id, db)
    
    return {
        "message": "Resume analyzed! Pick your vibe.",
        "slug": profile.slug,
        "data": parsed_data
    }


@skillvibe_router.post("/generate-portfolio")
async def generate_portfolio_with_template(
    template_id: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate the portfolio HTML using a specific template style"""
    # Check resume upload limit for non-premium users
    if not current_user.is_premium:
        resume_limit = 2
        if current_user.resume_upload_count >= resume_limit:
            raise HTTPException(
                status_code=403,
                detail=f"Resume upload limit reached ({resume_limit}). Upgrade to Pillar Elite for unlimited uploads."
            )
    
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Please upload a resume first.")

    client = get_pollinations_client()
    
    # Industrial Vibe Configuration (Skeletons, Colors, and Content Tone)
    VIBE_CONFIGS = {
        "futurist-ops": {
            "name": "Futurist Ops",
            "tone": "Futuristic, analytical, and systems-oriented. Use high-tech terminology."
        },
        "lead-strategist": {
            "name": "Executive Aura",
            "tone": "Authoritative, structured, and high-trust. Use corporate leadership language."
        },
        "serial-entrepreneur": {
            "name": "Terminal Void",
            "tone": "Deeply technical, brutalist, and engineering-focused. Use low-level system metaphors."
        },
        "venture-capital": {
            "name": "Growth Editorial",
            "tone": "Editorial, prestigious, and growth-oriented. Use 'High-Signal' and 'Impact' terminology."
        },
        "creative-specialist": {
            "name": "Prism Vision",
            "tone": "Avant-garde, creative, and experimental. Use sophisticated design and vision language."
        },
        "cyber-punk": {
            "name": "Cyber Signal",
            "tone": "High-contrast, rebellious, and rapid-fire. Use cyberpunk and glitch-culture metaphors."
        },
        "minimal-noir": {
            "name": "Minimal Noir",
            "tone": "Hyper-minimalist, black-and-white, and typography-focused. Use extremely concise, elite language."
        },
        "vintage-classic": {
            "name": "Vintage Paper",
            "tone": "Warm, classical, and academic. Use sophisticated, timeless, and narrative-heavy language."
        },
        "glass-prism": {
            "name": "Glass Prism",
            "tone": "Modern, vibrant, and approachable. Use energetic, optimistic, and forward-thinking language."
        },
        "midnight-gold": {
            "name": "Midnight Executive",
            "tone": "Extremely prestigious, luxury-themed, and exclusive. Use language that emphasizes rarity and high-stakes success."
        },
        "obsidian-elite": {
            "name": "Obsidian Elite",
            "tone": "Premium, dark, and high-contrast. Use authoritative, visionary, and reputation-centric language. High-signal content."
        },
        "ai-visionary": {
            "name": "AI Visionary",
            "tone": "Deeply technical yet visionary. Focus on breakthrough achievements in AI/ML and future-proofing. Bold, high-performance language."
        }
    }

    config = VIBE_CONFIGS.get(template_id, VIBE_CONFIGS["futurist-ops"])
    
    # Prepare data for AI
    experience_data = profile.experience if profile.experience else "[]"
    education_data = profile.education if profile.education else "[]"
    skills_data = profile.projects if profile.projects else "[]" 
    education_raw = profile.education if profile.education else "[]"
    projects_raw = profile.projects if profile.projects else "[]"
    
    # Social discovery...
    social_links_json = json.loads(profile.social_links) if profile.social_links else {}
    linkedin_url = clean_social_link(social_links_json.get("linkedin"), "linkedin")
    github_url = clean_social_link(social_links_json.get("github"), "github")
    portfolio_url = clean_social_link(social_links_json.get("portfolio"), "portfolio")

    # Prepare the System Prompt for the Content Strategist
    system_prompt = f"""
You are a World-Class Talent Stylist and Content Strategist. Your goal is to transform a resume into "Elite Narrative Snippets" for a high-end portfolio.

### THE VIBE TONE:
{config['tone']}

### OUTPUT FORMAT (JSON ONLY):
Return a JSON object with these EXACT keys:
- "elite_tag": A short 2-3 word prestige title.
- "category": Choose one: "development", "design", "ai_data", "product", "marketing".
- "experience_level": Choose one: "junior", "mid", "senior", "elite".
- "region": Choose one: "americas", "emea", "apac", "south_asia", "remote".
- "bio_summary": A 150-word high-impact professional narrative.
- "ai_verdict": A 3-sentence powerful analysis of professional rareity.
- "skills": A list of objects: [ {{ "category": "...", "tags": ["...", "..."] }} ]
- "experience": A list of objects: [ {{ "role": "...", "company": "...", "duration": "...", "bullets": ["...", "..."] }} ]
- "projects": A list of objects: [ {{ "title": "...", "description": "...", "tech_stack": ["...", "..."], "link": "..." }} ]
- "certifications": A list of objects: [ {{ "name": "...", "issuer": "...", "date": "..." }} ]
- "education": A list of objects: [ {{ "degree": "...", "school": "...", "year": "..." }} ]

### CRITICAL RULES:
1. NO TRUNCATION. 
2. ENHANCE the language to match the requested VIBE TONE.
3. Output ONLY valid RAW JSON. Do not include any markdown formatting or extra text.
"""

    try:
        print(f"[DEBUG] Synthesizing hybrid content for {current_user.username} (VIBE: {template_id})...")
        
        ai_response = await call_pollinations_with_fallback(
            system_prompt, 
            f"DATA FOR SYNTHESIS:\nEXPERIENCE: {experience_data}\nEDUCATION: {education_raw}\nPROJECTS: {projects_raw}\nSKILLS: {skills_data}\nRAW_CONTENT: {profile.raw_resume_text[:4000]}", 
            max_tokens=4000, 
            preferred_models=["mistral", "qwen-coder"]
        )

        ai_data = json.loads(ai_response.replace("```json", "").replace("```", "").strip())
        
        # Update Profile with New Structured Data
        profile.vibe_data = json.dumps(ai_data)
        profile.template_id = template_id
        profile.profile_completeness = 1.0
        
        # Populating the searchable columns
        profile.category = ai_data.get("category")
        profile.experience_level = ai_data.get("experience_level")
        profile.region = ai_data.get("region")
        
        # Clear legacy data
        profile.landing_page_data = None 
        db.commit()
        
        update_ranking(current_user.id, db)
        return {"message": "Success", "slug": profile.slug}

    except Exception as e:
        import traceback
        print(f"[ERROR] Engine failure: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@skillvibe_router.get("/my-profile")
async def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the current user's profile slug for redirect"""
    print(f"[DEBUG] Fetching profile for user_id: {current_user.id}")
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        print(f"[WARN] Profile not found for user_id: {current_user.id}")
        # Try to find user directly to see if they exist
        actual_user = db.query(User).filter(User.id == current_user.id).first()
        print(f"[DEBUG] Does user record exist? {actual_user is not None}")
        raise HTTPException(status_code=404, detail="Profile not found. Please upload your resume first.")
    return {
        "slug": profile.slug,
        "is_public": profile.is_public,
        "views": profile.profile_views
    }


@skillvibe_router.get("/profile/portfolio")
async def get_my_portfolio_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch the raw HTML of the current user's portfolio for editing"""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"html": profile.landing_page_data or ""}


@skillvibe_router.put("/profile/portfolio")
async def update_my_portfolio_data(
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save updated HTML for the user's portfolio"""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    html = data.get("html")
    if html is None:
        raise HTTPException(status_code=400, detail="HTML content is required")
    
    # Optional: Basic validation to ensure they aren't saving junk
    if len(html) > 0 and "<html" not in html.lower():
        # Minimal check
        pass

    profile.landing_page_data = html
    db.commit()
    
    # Invalidate frontend caches (if we had a way to signal it, but for now we'll handle it in FE)
    return {"message": "Vibe updated successfully"}


@skillvibe_router.patch("/profile/settings")
async def update_profile_settings(
    settings: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update profile settings like custom slug and visibility"""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    new_slug = settings.get("slug")
    if new_slug:
        # Only premium users can customize their URL slug
        if not current_user.is_premium:
            raise HTTPException(
                status_code=403,
                detail="Custom URL is a Pillar Elite feature. Upgrade to customize your portfolio link."
            )
        import re
        new_slug = re.sub(r'[^a-z0-9-]', '', new_slug.lower()).strip()
        if not new_slug:
             raise HTTPException(status_code=400, detail="Invalid slug")
             
        existing = db.query(Profile).filter(Profile.slug == new_slug, Profile.user_id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="This custom link is already taken. Try another!")
        
        profile.slug = new_slug
    
    if "is_public" in settings:
         profile.is_public = settings["is_public"]
    elif "visibility" in settings:
        profile.is_public = settings["visibility"] == "public"
    
    db.commit()
    return {"message": "Settings updated", "slug": profile.slug, "is_public": profile.is_public}

@skillvibe_router.put("/portfolio/update")
async def update_portfolio(
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update profile structured data and metadata"""
    # Premium-only feature: Portfolio customization
    if not current_user.is_premium:
        raise HTTPException(
            status_code=403,
            detail="Portfolio customization is available with Pillar Elite. Upgrade to unlock editing features."
        )
    
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Update metadata
    if "full_name" in data:
        profile.user.full_name = data["full_name"]
    if "headline" in data:
        profile.elite_tag = data["headline"]
    if "summary" in data:
        profile.summary = data["summary"]
    if "template_id" in data:
        profile.template_id = data["template_id"]
    
    # Update structured vibe_data
    if "vibe_data" in data:
        profile.vibe_data = json.dumps(data["vibe_data"])
        
    # Update social links
    if "social_links" in data:
        profile.social_links = json.dumps(data["social_links"])

    # Recalculate Trust on update
    t_score, verified, stage = calculate_trust_logic(profile, db)
    profile.trust_score = t_score
    profile.is_verified_trust = verified
    profile.verification_stage = stage

    db.commit()
    return {"message": "Vibe updated successfully"}


@skillvibe_router.get("/portfolio/{slug}/data")
async def get_portfolio_data(
    slug: str, 
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Return raw portfolio data for React rendering"""
    profile = db.query(Profile).filter(Profile.slug == slug).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Ownership check
    is_owner = current_user and current_user.id == profile.user_id

    # Privacy check: If not public and not the owner, reject access
    if not profile.is_public and not is_owner:
        raise HTTPException(status_code=403, detail="This profile is private")

    # Interaction status
    upvoted = False
    starred = False
    flagged = False
    if current_user:
        upvoted = db.query(ProfileInteraction).filter(
            ProfileInteraction.profile_id == profile.id,
            ProfileInteraction.user_id == current_user.id,
            ProfileInteraction.interaction_type == 'upvote'
        ).first() is not None
        starred = db.query(ProfileInteraction).filter(
            ProfileInteraction.profile_id == profile.id,
            ProfileInteraction.user_id == current_user.id,
            ProfileInteraction.interaction_type == 'star'
        ).first() is not None
        flagged = db.query(ProfileFlag).filter(
            ProfileFlag.profile_id == profile.id,
            ProfileFlag.flagger_id == current_user.id
        ).first() is not None

    return {
        "id": profile.id,
        "full_name": profile.user.full_name or profile.user.username,
        "headline": profile.elite_tag or "Elite Professional",
        "elite_rating": get_dynamic_prowess(profile)[0],
        "elite_tag": profile.elite_tag,
        "summary": profile.summary,
        "vibe_data": json.loads(profile.vibe_data) if profile.vibe_data else None,
        "template_id": profile.template_id,
        "social_links": json.loads(profile.social_links) if profile.social_links else {},
        "upvote_count": profile.upvote_count,
        "star_count": profile.star_count,
        "flag_count": profile.flag_count or 0,
        "ranking_score": profile.ranking_score,
        "is_verified_trust": profile.is_verified_trust,
        "trust_score": profile.trust_score,
        "verification_stage": get_dynamic_prowess(profile)[1],
        "is_owner": is_owner,
        "interaction": {
            "upvoted": upvoted,
            "starred": starred,
            "flagged": flagged,
            "viewer_role": current_user.role if current_user else None
        }
    }

@skillvibe_router.get("/portfolio/{slug}/html")
async def get_portfolio_html(slug: str):
    """Legacy endpoint. Portfolios have migrated to Node.js rendering."""
    raise HTTPException(
        status_code=410, 
        detail="This endpoint is deprecated. Portfolios are now rendered natively in the frontend."
    )

def get_dynamic_prowess(profile: Profile):
    """Consistent calculation for Elite Rating (%) and Stage mapping across the app"""
    base = profile.elite_rating or 30.0 # Lowered base from 50.0
    bonus = (profile.upvote_count * 0.5) + (profile.star_count * 1.0) + (profile.profile_views * 0.05)
    penalty = (profile.flag_count or 0) * 2.5 # Increased report penalty to -2.5%
    
    percentage = round(max(min(base + bonus - penalty, 100.0), 0.0), 1)
    
    # Dynamic Stage Mapping
    if percentage >= 86.0:
        stage = 3 # Titan
    elif percentage >= 55.0:
        stage = 2 # Pillar
    else:
        stage = 1 # Seed
        
    return percentage, stage


@skillvibe_router.post("/portfolio/{slug}/upvote")
async def upvote_portfolio(request: Request, slug: str, db: Session = Depends(get_db), current_user: User = Depends(get_optional_current_user)):
    profile = db.query(Profile).filter(Profile.slug.ilike(slug)).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    ip = request.client.host
    user_id = current_user.id if current_user else None
    
    # 1. Block Self-Interaction
    if current_user and current_user.id == profile.user_id:
        raise HTTPException(status_code=403, detail="You cannot signal boost your own profile.")
    
    # 2. Strict Recruiter-Only Logic
    if not current_user:
        raise HTTPException(status_code=401, detail="Only verified scouts can boost talent. Please login as a Recruiter.")
    
    if current_user.role != 'recruiter':
        raise HTTPException(status_code=403, detail="Only recruiters and hiring teams are authorized to boost talent signals.")

    # Check if already interacted — toggle off if so
    existing = db.query(ProfileInteraction).filter(
        ProfileInteraction.profile_id == profile.id,
        ProfileInteraction.interaction_type == "upvote",
        (ProfileInteraction.user_id == user_id)
    ).first()
    
    if existing:
        # Toggle: Remove the upvote
        db.delete(existing)
        profile.upvote_count = max(0, profile.upvote_count - 1)
        db.commit()
        update_ranking(profile.user_id, db)
        prowess, stage = get_dynamic_prowess(profile)
        return {"message": "Upvote removed", "upvotes": profile.upvote_count, "voted": False, "ranking_score": profile.ranking_score, "trust_score": profile.trust_score, "is_verified_trust": profile.is_verified_trust, "elite_rating": prowess, "verification_stage": stage}
    
    # Create interaction record
    interaction = ProfileInteraction(
        profile_id=profile.id,
        user_id=user_id,
        ip_address=ip,
        interaction_type="upvote"
    )
    db.add(interaction)
    profile.upvote_count += 1
    db.commit()
    update_ranking(profile.user_id, db)
    prowess, stage = get_dynamic_prowess(profile)
    return {"message": "Upvoted!", "upvotes": profile.upvote_count, "voted": True, "ranking_score": profile.ranking_score, "trust_score": profile.trust_score, "is_verified_trust": profile.is_verified_trust, "elite_rating": prowess, "verification_stage": stage}

@skillvibe_router.post("/portfolio/{slug}/star")
async def star_portfolio(request: Request, slug: str, db: Session = Depends(get_db), current_user: User = Depends(get_optional_current_user)):
    profile = db.query(Profile).filter(Profile.slug.ilike(slug)).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Vibe profile not found")
    
    ip = request.client.host
    user_id = current_user.id if current_user else None
    
    # 1. Block Self-Interaction
    if current_user and current_user.id == profile.user_id:
        raise HTTPException(status_code=403, detail="You cannot endorse your own profile.")
    
    # 2. Strict Recruiter-Only Logic
    if not current_user:
        raise HTTPException(status_code=401, detail="Only verified hiring teams can endorse talent. Please login as a Recruiter.")
    
    if current_user.role != 'recruiter':
        raise HTTPException(status_code=403, detail="Only recruiters are authorized to verify and endorse talent.")

    # Toggle shortlist if already interacted
    existing = db.query(ProfileInteraction).filter(
        ProfileInteraction.profile_id == profile.id,
        ProfileInteraction.interaction_type == "star",
        (ProfileInteraction.user_id == user_id)
    ).first()
    
    if existing:
        db.delete(existing)
        profile.star_count = max(0, (profile.star_count or 0) - 1)
        db.commit()
        update_ranking(profile.user_id, db)
        prowess, stage = get_dynamic_prowess(profile)
        return {"message": "Shortlist removed", "stars": profile.star_count, "voted": False, "ranking_score": profile.ranking_score, "trust_score": profile.trust_score, "is_verified_trust": profile.is_verified_trust, "elite_rating": prowess, "verification_stage": stage}
    
    # Create interaction record
    interaction = ProfileInteraction(
        profile_id=profile.id,
        user_id=user_id,
        ip_address=ip,
        interaction_type="star"
    )
    db.add(interaction)
    profile.star_count += 1
    db.commit()
    update_ranking(profile.user_id, db)
    prowess, stage = get_dynamic_prowess(profile)
    return {"message": "Candidate shortlisted", "stars": profile.star_count, "voted": True, "ranking_score": profile.ranking_score, "trust_score": profile.trust_score, "is_verified_trust": profile.is_verified_trust, "elite_rating": prowess, "verification_stage": stage}

@skillvibe_router.post("/portfolio/{slug}/flag")
async def flag_portfolio(request: Request, slug: str, data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_optional_current_user)):
    profile = db.query(Profile).filter(Profile.slug.ilike(slug)).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    reason = data.get("reason", "No reason provided")
    ip = request.client.host
    user_id = current_user.id if current_user else None
    
    # 1. Block Self-Flagging
    if current_user and current_user.id == profile.user_id:
        raise HTTPException(status_code=403, detail="You cannot report or flag your own profile.")
    
    # 2. Strict Recruiter-Only Logic
    if not current_user:
        raise HTTPException(status_code=401, detail="Only verified scouts can report anomalies. Please login as a Recruiter.")
    
    if current_user.role != 'recruiter':
        raise HTTPException(status_code=403, detail="Only recruiters and hiring teams are authorized to flag profiles.")

    # Check if already flagged by this recruiter — toggle off if so
    existing = db.query(ProfileFlag).filter(
        ProfileFlag.profile_id == profile.id,
        ProfileFlag.flagger_id == user_id
    ).first()
    
    if existing:
        # Toggle: Remove the flag
        db.delete(existing)
        profile.flag_count = max(0, (profile.flag_count or 0) - 1)
        db.commit()
        update_ranking(profile.user_id, db)
        prowess, stage = get_dynamic_prowess(profile)
        return {"message": "Report withdrawn.", "flags": profile.flag_count, "ranking_score": profile.ranking_score, "flagged": False, "trust_score": profile.trust_score, "is_verified_trust": profile.is_verified_trust, "elite_rating": prowess, "verification_stage": stage}

    flag = ProfileFlag(
        profile_id=profile.id, 
        flagger_id=user_id, 
        reason=reason
    )
    db.add(flag)
    profile.flag_count = (profile.flag_count or 0) + 1
    db.commit()
    update_ranking(profile.user_id, db)
    prowess, stage = get_dynamic_prowess(profile)
    return {"message": "Report received. Audit in progress.", "flags": profile.flag_count, "ranking_score": profile.ranking_score, "flagged": True, "trust_score": profile.trust_score, "is_verified_trust": profile.is_verified_trust, "elite_rating": prowess, "verification_stage": stage}


@skillvibe_router.post("/contact/{slug}")
async def contact_candidate(slug: str, data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Send a message to a candidate from a recruiter"""

    # Recruiter-only access
    if current_user.role != 'recruiter':
        raise HTTPException(status_code=403, detail="Only recruiters can contact candidates")

    profile = db.query(Profile).filter(Profile.slug.ilike(slug)).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    # Prevent self-contact
    if profile.user_id == current_user.id:
        raise HTTPException(status_code=403, detail="You cannot contact yourself")

    subject = data.get('subject', '').strip()
    message = data.get('message', '').strip()

    if not subject or not message:
        raise HTTPException(status_code=400, detail="Subject and message are required")

    if len(subject) > 100:
        raise HTTPException(status_code=400, detail="Subject must be 100 characters or less")

    if len(message) > 5000:
        raise HTTPException(status_code=400, detail="Message must be 5000 characters or less")

    # Get candidate user details
    candidate_user = db.query(User).filter(User.id == profile.user_id).first()
    if not candidate_user:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Send email to candidate
    from email_service import email_service
    email_sent = email_service.send_recruiter_contact_email(
        to_email=candidate_user.email,
        candidate_name=candidate_user.full_name or candidate_user.username,
        recruiter_name=current_user.full_name or current_user.username,
        recruiter_email=current_user.email,
        subject=subject,
        message=message
    )

    if not email_sent:
        raise HTTPException(status_code=500, detail="Failed to send message. Please try again later.")

    # Record the interaction
    interaction = ProfileInteraction(
        profile_id=profile.id,
        user_id=current_user.id,
        ip_address=None,
        interaction_type="contact"
    )
    db.add(interaction)
    db.commit()

    return {"message": "Your message has been sent successfully to the candidate!"}


@skillvibe_router.get("/profiles/{slug}")
async def get_profile(slug: str, db: Session = Depends(get_db)):
    clean_slug = slug.strip().lower()
    profile = db.query(Profile).filter(func.lower(Profile.slug) == clean_slug).first()
    if not profile:
        # Fallback to fuzzy
        profile = db.query(Profile).filter(Profile.slug.ilike(f"%{clean_slug}%")).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
    
    # Increment views
    profile.profile_views += 1
    db.commit()
    
    user = profile.user
    
    # Calculate stats
    avg_rating = db.query(func.avg(Rating.score)).filter(Rating.candidate_id == user.id).scalar() or 0
    endorsements = db.query(Skill.name, func.count(Endorsement.id).label("count"))\
        .join(Endorsement, Skill.id == Endorsement.skill_id)\
        .filter(Endorsement.candidate_id == user.id)\
        .group_by(Skill.name).all()
    
    # Check if portfolio HTML exists
    has_portfolio = bool(profile.landing_page_data and profile.landing_page_data.strip())
    
    return {
        "id": user.id,
        "full_name": user.full_name,
        "username": user.username,
        "profile_picture": user.profile_picture,
        "summary": profile.summary,
        "experience": json.loads(profile.experience) if profile.experience else [],
        "education": json.loads(profile.education) if profile.education else [],
        "skills_list": json.loads(profile.projects) if profile.projects else [],
        "location": profile.location,
        "avg_rating": round(avg_rating, 1),
        "endorsements": [{"skill": e[0], "count": e[1]} for e in endorsements],
        "ranking_score": profile.ranking_score,
        "elite_rating": profile.elite_rating or 0,
        "elite_tag": profile.elite_tag or "Rising",
        "profile_views": profile.profile_views,
        "has_portfolio": has_portfolio
    }

@skillvibe_router.post("/rate")
async def rate_profile(
    candidate_id: int = Body(...),
    score: int = Body(...),
    comment: Optional[str] = Body(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if score < 1 or score > 5:
        raise HTTPException(status_code=400, detail="Score must be between 1 and 5")
    
    # Check if already rated
    existing = db.query(Rating).filter(Rating.candidate_id == candidate_id, Rating.rater_id == current_user.id).first()
    if existing:
        existing.score = score
        existing.comment = comment
    else:
        rating = Rating(candidate_id=candidate_id, rater_id=current_user.id, score=score, comment=comment)
        db.add(rating)
    
    db.commit()
    
    # Update ranking score (simple version)
    update_ranking(candidate_id, db)
    
    return {"message": "Rating submitted"}

@skillvibe_router.post("/endorse")
async def endorse_skill(
    candidate_id: int = Body(...),
    skill_name: str = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    skill = db.query(Skill).filter(Skill.name == skill_name).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    # Check if already endorsed
    existing = db.query(Endorsement).filter(
        Endorsement.candidate_id == candidate_id, 
        Endorsement.skill_id == skill.id,
        Endorsement.endorser_id == current_user.id
    ).first()
    
    if existing:
        return {"message": "Already endorsed"}
    
    endorsement = Endorsement(candidate_id=candidate_id, skill_id=skill.id, endorser_id=current_user.id)
    db.add(endorsement)
    db.commit()
    
    update_ranking(candidate_id, db)
    return {"message": "Skill endorsed"}

@skillvibe_router.get("/leaderboard")
async def get_leaderboard(
    by: str = "rating", # 'rating', 'skill', 'location'
    skill_name: Optional[str] = None,
    location: Optional[str] = None,
    tier: str = "free", # 'free' or 'pro' - separate leaderboards by user tier
    db: Session = Depends(get_db)
):
    query = db.query(Profile).join(User).filter(
        User.role == 'candidate',
        Profile.is_public == True,
        User.is_premium == (tier == "pro")  # Filter by tier
    )
    
    if by == "rating":
        query = query.order_by(desc(Profile.ranking_score))
    elif by == "skill" and skill_name:
        query = query.join(Endorsement, User.id == Endorsement.candidate_id)\
                     .join(Skill, Endorsement.skill_id == Skill.id)\
                     .filter(Skill.name == skill_name)\
                     .order_by(desc(Profile.ranking_score))
    elif by == "location" and location:
        query = query.filter(Profile.location.ilike(f"%{location}%"))\
                     .order_by(desc(Profile.ranking_score))
    
    results = query.limit(10).all()
    
    leaderboard = []
    for p in results:
        leaderboard.append({
            "username": p.user.username,
            "full_name": p.user.full_name,
            "profile_picture": p.user.profile_picture,
            "ranking_score": p.ranking_score,
            "slug": p.slug,
            "tier": "Pro" if p.user.is_premium else "Free"  # Include tier info
        })
    
    return {"tier": tier, "leaderboard": leaderboard}

@skillvibe_router.get("/recruiter/candidates")
async def get_candidates(
    skill: Optional[str] = None,
    location: Optional[str] = None,
    min_rating: float = 0.0,
    shortlisted_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=403, detail="Only recruiters can access this")
    
    query = db.query(Profile).join(User).filter(
        User.role == 'candidate',
        Profile.is_public == True
    )
    
    if skill:
        search_term = f"%{skill.strip()}%"
        query = query.outerjoin(Endorsement, User.id == Endorsement.candidate_id)\
                     .outerjoin(Skill, Endorsement.skill_id == Skill.id)\
                     .filter(or_(
                        Skill.name.ilike(search_term),
                        User.full_name.ilike(search_term),
                        User.username.ilike(search_term),
                        Profile.summary.ilike(search_term),
                        Profile.projects.ilike(search_term)
                     ))
    
    if location:
        query = query.filter(Profile.location.ilike(f"%{location}%"))

    candidates = query.order_by(Profile.id, desc(Profile.ranking_score)).distinct(Profile.id).all()
    shortlisted_profile_ids = {
        row.profile_id for row in db.query(ProfileInteraction.profile_id).filter(
            ProfileInteraction.user_id == current_user.id,
            ProfileInteraction.interaction_type == "star"
        ).all()
    }
    
    output = []
    for p in candidates:
        avg_rating = db.query(func.avg(Rating.score)).filter(Rating.candidate_id == p.user_id).scalar() or 0
        
        # Calculate a dynamic "Vibe Score" if ranking_score is uninitialized
        # Otherwise use the ranking score
        vibe_score = p.ranking_score
        if vibe_score <= 0:
            # Synthetic vibe for new users based on profile completeness and a small random variance for "feel"
            import random
            base_vibe = 65 + (p.profile_completeness * 20)
            vibe_score = base_vibe + random.uniform(2, 7)
            
        # Use explicit ratings where available, otherwise derive a stable display rating from vibe score.
        display_rating = round(avg_rating, 1) if avg_rating > 0 else round(min(vibe_score, 100) / 20, 1)
        is_shortlisted = p.id in shortlisted_profile_ids
        if shortlisted_only and not is_shortlisted:
            continue

        if display_rating >= min_rating:
            social_links = json.loads(p.social_links) if p.social_links else {}
            skills = json.loads(p.projects) if p.projects else []
            output.append({
                "id": p.user_id,
                "full_name": p.user.full_name,
                "username": p.user.username,
                "email": p.user.email,
                "profile_picture": p.user.profile_picture,
                "location": p.location,
                "avg_rating": display_rating,
                "vibe_score": round(min(vibe_score, 100), 1),
                "ai_summary": p.summary[:120] + "..." if p.summary else "Awaiting AI synthesis of this candidate's exceptional trajectory.",
                "slug": p.slug,
                "skills": skills[:8] if isinstance(skills, list) else [],
                "social_links": social_links if isinstance(social_links, dict) else {},
                "shortlisted": is_shortlisted
            })
            
    return output

@skillvibe_router.get("/founder-scorecard")
async def get_founder_scorecard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyze the profile for founder-market fit and operational readiness"""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Upload resume first.")

    try:
        client = get_pollinations_client()
        prompt = f"""
        Analyze this founder/professional background for startup readiness:
        {profile.raw_resume_text[:4000] if profile.raw_resume_text else profile.summary}

        Return a JSON object with:
        1. "founder_score": (0-100)
        2. "metrics": {{
            "market_fit": (0-100),
            "technical_depth": (0-100),
            "execution_velocity": (0-100),
            "ops_readiness": (0-100)
        }}
        3. "insights": list of 3 punchy founder-ops insights
        4. "roadmap": list of 3 next steps for their startup brand
        Output ONLY RAW JSON.
        """
        system_msg = "You are an Elite SkillVibe AI. Analyze the founder profile and return RAW JSON ONLY."
        raw_content = await call_pollinations_with_fallback(system_msg, prompt)
        content = raw_content.strip()
        if "```" in content:
            content = content.split("```")[1].replace("json", "", 1).strip()
        
        return json.loads(content)
    except Exception as e:
        print(f"[ERROR] Founder scorecard failed: {e}")
        return {
            "founder_score": 75,
            "metrics": {"market_fit": 80, "technical_depth": 70, "execution_velocity": 85, "ops_readiness": 65},
            "insights": ["Strong domain expertise detected.", "Needs more focus on scalable ops.", "High execution potential."],
            "roadmap": ["Build a One-Pager", "Validate Market MVP", "Optimize Founder Presence"]
        }

@skillvibe_router.get("/recruiter/ai-search")
async def ai_search_candidates(
    prompt: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=403, detail="Only recruiters can access this")
    
    # Get all profiles for context (simple version - for prod use vector DB)
    profiles = db.query(Profile).all()
    candidate_context = []
    for p in profiles:
        candidate_context.append({
            "id": p.user_id,
            "name": p.user.full_name,
            "summary": p.summary,
            "skills": json.loads(p.projects) if p.projects else [],
            "score": p.ranking_score
        })

    try:
        system_msg = """
        You are an AI Talent Scout for SkillVibe. 
        Given a recruiter's request and candidate profiles, return a JSON object with:
        - 'matches': A list of objects {id: int, reason: str} for the top candidates who best fit.
        Rank them by match quality. Output ONLY the JSON object.
        """
        user_msg = f"Request: {prompt}\n\nCandidates: {json.dumps(candidate_context)}"
        raw_result = await call_pollinations_with_fallback(system_msg, user_msg, preferred_models=["mistral", "grok", "kimi"])
        result = json.loads(raw_result.replace("```json", "").replace("```", "").strip())
        matches_data = result.get("matches", [])
        matched_ids = [m.get("id") for m in matches_data]
        reasons_map = {m.get("id"): m.get("reason") for m in matches_data}
    except Exception:
        matched_ids = []
        reasons_map = {}

    matches = db.query(Profile).filter(Profile.user_id.in_(matched_ids)).all()
    # Sort matches according to the order in matched_ids
    matches_sorted = sorted(matches, key=lambda m: matched_ids.index(m.user_id) if m.user_id in matched_ids else 999)
    
    return [
        {
            "id": m.user_id, 
            "name": m.user.full_name, 
            "slug": m.slug, 
            "vibe_score": m.ranking_score, 
            "score": m.ranking_score, 
            "reason": reasons_map.get(m.user_id, "Strong match identified by AI."),
            "ai_match": True
        } for m in matches_sorted if m.user_id in matched_ids
    ]



@skillvibe_router.post("/vibe-note")
async def add_vibe_note(
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Allow recruiters to leave social endorsements/vibe notes for talent"""
    if current_user.role != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can leave vibe notes")
        
    profile_id = data.get("profile_id")
    content = data.get("content")
    vibe_type = data.get("vibe_type", "professional")
    
    if not profile_id or not content:
        raise HTTPException(status_code=400, detail="Missing profile ID or content")
        
    # Global quality limit for the recruiter (maintain exclusive nature of vibe notes)
    total_notes_left = db.query(VibeNote).filter(VibeNote.author_id == current_user.id).count()
    if total_notes_left >= 20:
        raise HTTPException(
            status_code=400, 
            detail="You have reached your total Vibe Note limit (20). To maintain protocol integrity, each recruiter has a finite number of elite endorsements."
        )

    # Check if recruiter has already left a note for this profile to prevent score gaming
    existing_note = db.query(VibeNote).filter(
        VibeNote.profile_id == profile_id,
        VibeNote.author_id == current_user.id
    ).first()
    
    if existing_note:
        raise HTTPException(
            status_code=400, 
            detail="You have already left a Vibe Note for this profile. Only one endorsement per recruiter is permitted."
        )
        
    note = VibeNote(
        profile_id=profile_id,
        author_id=current_user.id,
        content=content.strip(),
        vibe_type=vibe_type
    )
    db.add(note)
    db.commit()
    
    target_profile = db.query(Profile).filter(Profile.id == profile_id).first()
    trust_score = 0
    is_verified_trust = False
    ranking_score = 0
    if target_profile:
        update_ranking(target_profile.user_id, db)
        db.refresh(target_profile)
        trust_score = target_profile.trust_score
        is_verified_trust = target_profile.is_verified_trust
        ranking_score = target_profile.ranking_score
        prowess, stage = get_dynamic_prowess(target_profile)
        
    return {
        "message": "Vibe Note added successfully!",
        "trust_score": trust_score,
        "is_verified_trust": is_verified_trust,
        "ranking_score": ranking_score,
        "elite_rating": prowess,
        "verification_stage": stage
    }

@skillvibe_router.get("/vibe-notes/me")
async def get_my_vibe_notes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Fetch vibe notes for the current authenticated user"""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        return []
        
    notes = db.query(VibeNote).filter(VibeNote.profile_id == profile.id).order_by(VibeNote.created_at.desc()).all()
    
    return [{
        "author_id": n.author_id,
        "author_name": n.author.full_name or n.author.username,
        "author_role": n.author.role,
        "content": n.content,
        "vibe_type": n.vibe_type,
        "created_at": n.created_at
    } for n in notes]

@skillvibe_router.get("/vibe-notes/{slug}")
async def get_vibe_notes(slug: str, db: Session = Depends(get_db)):
    """Fetch public vibe notes for a creative profile"""
    profile = db.query(Profile).filter(Profile.slug == slug).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    notes = db.query(VibeNote).filter(VibeNote.profile_id == profile.id).order_by(VibeNote.created_at.desc()).all()
    
    return [{
        "author_id": n.author_id,
        "author_name": n.author.full_name or n.author.username,
        "author_role": n.author.role,
        "content": n.content,
        "vibe_type": n.vibe_type,
        "created_at": n.created_at
    } for n in notes]

@skillvibe_router.get("/vibe-history/me")
async def get_my_vibe_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Fetch interaction history with points breakdown for the current user"""
    # Only premium users can access vibe history
    if not current_user.is_premium:
        raise HTTPException(
            status_code=403,
            detail="Vibe History is a Pillar Elite feature. Upgrade to track your interactions and points."
        )
    
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        return {"trust_score": 0.0, "elite_rating": 0.0, "history": []}
        
    history = []
    
    # 1. Profile Interactions (Upvotes/Stars)
    interactions = db.query(ProfileInteraction, User)\
        .outerjoin(User, ProfileInteraction.user_id == User.id)\
        .filter(ProfileInteraction.profile_id == profile.id)\
        .all()
        
    for i, u in interactions:
        author_name = u.full_name or u.username if u else "Anonymous Recruiter"
        author_role = u.role if u else "recruiter"
        point_prowess = 0.5 if i.interaction_type == "upvote" else 1.0
        point_trust = 0.1 if i.interaction_type == "upvote" else 0.2
        label = "Signal Boost" if i.interaction_type == "upvote" else "Shortlisted"
        
        history.append({
            "type": "interaction",
            "action_label": label,
            "author_name": author_name,
            "author_role": author_role,
            "points_prowess": point_prowess,
            "points_trust": point_trust,
            "created_at": i.created_at
        })

    # 2. Vibe Notes
    notes = db.query(VibeNote)\
        .join(User, VibeNote.author_id == User.id, isouter=True)\
        .filter(VibeNote.profile_id == profile.id)\
        .all()
        
    for n in notes:
        author_name = n.author.full_name or n.author.username if n.author else "Anonymous Recruiter"
        author_role = n.author.role if n.author else "recruiter"
        history.append({
            "type": "vibe_note",
            "action_label": "Vibe Note",
            "author_name": author_name,
            "author_role": author_role,
            "points_prowess": 0.0,
            "points_trust": 0.5,
            "content": n.content,
            "created_at": n.created_at
        })
        
    # 3. Reports/Flags
    flags = db.query(ProfileFlag, User)\
        .outerjoin(User, ProfileFlag.flagger_id == User.id)\
        .filter(ProfileFlag.profile_id == profile.id)\
        .all()
        
    for f, u in flags:
        author_name = u.full_name or u.username if u else "Anonymous User"
        history.append({
            "type": "report",
            "action_label": "Reported Profile",
            "author_name": author_name,
            "author_role": "user",
            "points_prowess": -2.5,
            "points_trust": -0.5,
            "content": f.reason,
            "created_at": f.created_at
        })

    # Sort history by created_at descending
    history.sort(key=lambda x: x["created_at"] or datetime.min, reverse=True)
    
    # Dynamic Prowess and Stage calculation
    prowess, stage = get_dynamic_prowess(profile)

    return {
        "trust_score": profile.trust_score,
        "elite_rating": prowess,
        "verification_stage": stage,
        "history": history
    }

def calculate_trust_logic(profile: Profile, db: Session):
    """
    Calculate trust score (0-5) and verification status based on data quality and social proof.
    """
    score = 0.0
    
    # 1. Data Integrity (up to 2 points)
    if profile.summary and len(profile.summary) > 100:
        score += 0.5
    
    try:
        exp = json.loads(profile.experience) if profile.experience else []
        if len(exp) >= 2: score += 0.5
    except: pass
    
    try:
        skills = json.loads(profile.projects) if profile.projects else []
        if len(skills) >= 5: score += 0.5
    except: pass
        
    if profile.location and profile.location != "Remote":
        score += 0.5
        
    # 2. Linkages (1 point)
    try:
        links = json.loads(profile.social_links) if profile.social_links else {}
        valid_links = [k for k, v in links.items() if v and v != "#"]
        if len(valid_links) >= 2: score += 1.0
        elif len(valid_links) >= 1: score += 0.5
    except: pass
    
    # 3. Performance Signal (1 point)
    if profile.elite_rating >= 85:
        score += 1.0
    elif profile.elite_rating >= 70:
        score += 0.5
        
    # 4. Social Velocity (Up to 2.0 points)
    social_score = (profile.upvote_count * 0.1) + (profile.star_count * 0.2) + (profile.profile_views * 0.01)
    score += min(social_score, 2.0)
        
    # 5. AI Integrity Audit (1 point)
    # Factor in the machine-learning sniff test
    try:
        vibe_data = json.loads(profile.vibe_data) if profile.vibe_data else {}
        integrity = vibe_data.get("integrity", {})
        ai_integrity_score = integrity.get("score", 0.5) # Fallback to neutral
        
        # Integrity score is 0.0 to 1.0, we want it to add up to 1.0 to the Trust Score
        score += float(ai_integrity_score)
        
        # Penalty for high AI generation probability
        if integrity.get("is_potentially_ai_generated"):
            score -= 0.5
    except:
        pass
        
    # 6. Elite Stage Calculation (The 3 Stages)
    # Uses the dynamic prowess to determine current standing
    prowess, stage = get_dynamic_prowess(profile)

    # Verification Requirements:
    vibe_note_count = db.query(VibeNote).filter(VibeNote.profile_id == profile.id).count()
    score += min(vibe_note_count * 0.5, 1.5)
    
    # A user is "Verified" if they are truly elite (90+) OR have peer endorsements (Vibe Notes)
    has_vibe_notes = vibe_note_count > 0
    
    # Penalty for Flags (Deduct 0.5 per flag)
    score -= (profile.flag_count or 0) * 0.5
    
    # Use dynamic prowess for verification check
    is_verified = (prowess >= 90.0) or (has_vibe_notes and score >= 3.5)
    
    return round(max(min(score, 5.0), 0.0), 2), is_verified, stage

def update_ranking(candidate_id: int, db: Session):
    # Smart AI-Hybrid ranking system
    profile = db.query(Profile).filter(Profile.user_id == candidate_id).first()
    if not profile:
        return
    
    avg_rating = db.query(func.avg(Rating.score)).filter(Rating.candidate_id == candidate_id).scalar() or 0
    endorsement_count = db.query(Endorsement).filter(Endorsement.candidate_id == candidate_id).count()
    
    # ── BASE VIBE (Foundation) ──
    # elite_rating is the AI's opinion of their raw horse-power
    base_floor = profile.elite_rating * 0.6  # AI's opinion is 60% of the base
    
    # ── COMPLETENESS FACTOR (0-5 points) ──
    completeness_impact = profile.profile_completeness * 5.0
    
    # ── RATING FACTOR (0-10 points) ──
    rating_impact = (avg_rating / 5.0) * 10.0 if avg_rating > 0 else 0
    
    # ── SOCIAL FACTOR (Upvotes/Stars) (0-15 points) ──
    # Each upvote counts for 0.5, each star for 1.0, capped at 15 points
    social_impact = min((profile.upvote_count * 0.5) + (profile.star_count * 1.0), 15.0)
    
    # ── VIEW FACTOR (0-5 points) ──
    view_impact = min(profile.profile_views * 0.1, 5.0)
    
    # ── ENDORSEMENT FACTOR (0-5 points) ──
    endorsement_impact = min(endorsement_count, 10) * 0.5
    
    # ── VIBE NOTE FACTOR (0-10 points) ──
    vibe_note_count = db.query(VibeNote).filter(VibeNote.profile_id == profile.id).count()
    vibe_impact = min(vibe_note_count * 2.0, 10.0)

    # ── TRUST SYSTEM (0-15 points) ──
    # verification gives a flat 10 point boost, trust_score adds up to 5
    
    # Recalculate Trust Logic
    t_score, verified, stage = calculate_trust_logic(profile, db)
    profile.trust_score = t_score
    profile.is_verified_trust = verified
    profile.verification_stage = stage
    
    trust_impact = (10.0 if profile.is_verified_trust else 0) + min(profile.trust_score or 0, 5.0)
    
    # ── FLAG PENALTY (0 to -20 points) ──
    # Each flag/report deducts 2 points, capped at -20
    flag_penalty = min((profile.flag_count or 0) * 2.0, 20.0)
    
    # ── AI PRESTIGE (Multiplier) ──
    prestige_multiplier = 1.2 if profile.profile_completeness >= 1.0 else 1.0
    
    import random
    jitter = random.uniform(0.05, 0.95)
    
    total_raw = base_floor + completeness_impact + rating_impact + social_impact + view_impact + endorsement_impact + vibe_impact + trust_impact - flag_penalty + jitter
    
    # Final clamping and rounding (minimum 0)
    profile.ranking_score = round(max(min(total_raw * prestige_multiplier, 99.9), 0.0), 2)
    db.commit()
