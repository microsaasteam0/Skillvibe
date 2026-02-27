from .snippetstream_routes import snippetstream_router
from .auth_routes import auth_router
from .content_routes import content_router
from .payment_routes_new import payment_router
from .template_routes import router as template_router
from .public_only_routes import public_router
from .admin_routes import router as admin_router
from .skillvibe_routes import skillvibe_router
from .job_routes import job_router
from .dev_routes import dev_router
from .export_routes import export_router
from .support_routes import router as support_router

def register_routes(app):
    app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
    app.include_router(skillvibe_router, prefix="/api/v1", tags=["SkillVibe"])
    app.include_router(job_router, prefix="/api/v1", tags=["Jobs"])
    app.include_router(content_router, prefix="/api/v1/content", tags=["Content Management"])
    app.include_router(payment_router, prefix="/api/v1/payment", tags=["Payment & Subscriptions"])
    app.include_router(export_router, tags=["Export"])
    app.include_router(template_router, tags=["Custom Templates"])
    app.include_router(public_router, tags=["Public Only"])
    app.include_router(admin_router, tags=["Admin"])
    app.include_router(support_router, tags=["Support"])
    app.include_router(snippetstream_router, prefix="/api/v1", tags=["SnippetStream"])
    
    if dev_router:
        app.include_router(dev_router, tags=["Development"])
