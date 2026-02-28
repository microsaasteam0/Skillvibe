from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from database import get_db
from models import CustomTemplate
from datetime import datetime
import time

# Create a separate router specifically for public endpoints
public_router = APIRouter(prefix="/api/v1/public", tags=["public"])

# Response model for public templates
class PublicTemplateResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: str
    content: str
    tags: Optional[str]
    usage_count: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

@public_router.get("/test")
async def test_public_endpoint():
    """Test endpoint to verify public access works"""
    return {
        "message": "Public endpoint working",
        "timestamp": time.time(),
        "status": "success"
    }

@public_router.get("/templates", response_model=List[PublicTemplateResponse])
async def get_public_templates(
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all public templates - no authentication required"""
    try:
        print(f"🌐 Public templates endpoint called - category: {category}")
        
        # Get all public templates
        query = db.query(CustomTemplate).filter(CustomTemplate.is_public == True)
        if category:
            query = query.filter(CustomTemplate.category == category)
        
        templates = query.order_by(CustomTemplate.usage_count.desc(), CustomTemplate.created_at.desc()).all()
        
        print(f"📊 Found {len(templates)} public templates")
        
        if not templates:
            print("⚠️ No public templates found in database")
            return []
        
        # Convert to response format
        response_templates = []
        for template in templates:
            try:
                template_dict = {
                    "id": template.id,
                    "name": template.name,
                    "description": template.description,
                    "category": template.category,
                    "content": template.content,
                    "tags": template.tags,
                    "usage_count": template.usage_count,
                    "created_at": template.created_at,
                    "updated_at": template.updated_at
                }
                response_template = PublicTemplateResponse(**template_dict)
                response_templates.append(response_template)
                print(f"✅ Processed template: {template.name}")
            except Exception as template_error:
                print(f"❌ Error processing template {template.id}: {template_error}")
                continue
        
        print(f"✅ Returning {len(response_templates)} templates")
        return response_templates
        
    except Exception as e:
        print(f"❌ Error fetching public templates: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch public templates: {str(e)}"
        )

@public_router.get("/templates/debug")
async def debug_public_templates(db: Session = Depends(get_db)):
    """Debug endpoint to check raw public template data"""
    try:
        templates = db.query(CustomTemplate).filter(CustomTemplate.is_public == True).limit(3).all()
        
        debug_data = []
        for template in templates:
            debug_data.append({
                "id": template.id,
                "name": template.name,
                "description": template.description,
                "category": template.category,
                "content_length": len(template.content) if template.content else 0,
                "tags": template.tags,
                "is_public": template.is_public,
                "usage_count": template.usage_count,
                "is_favorite": template.is_favorite,
                "created_at": str(template.created_at),
                "updated_at": str(template.updated_at) if template.updated_at else None,
                "user_id": template.user_id
            })
        
        return {
            "total_public_templates": db.query(CustomTemplate).filter(CustomTemplate.is_public == True).count(),
            "sample_templates": debug_data
        }
        
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }

@public_router.get("/profiles/sitemap")
async def get_profiles_sitemap(db: Session = Depends(get_db)):
    """Get all public profile slugs and their last updated times for sitemap.xml"""
    try:
        from models import Profile
        
        profiles = db.query(Profile).filter(Profile.is_public == True).all()
        
        sitemap_data = []
        for profile in profiles:
            sitemap_data.append({
                "slug": profile.slug,
                "updated_at": profile.updated_at.isoformat() if profile.updated_at else profile.created_at.isoformat()
            })
            
        return sitemap_data
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch profiles for sitemap: {str(e)}"
        )