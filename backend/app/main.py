from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.rate_limit import RateLimitMiddleware

from app.api.v1 import api_router
from app.core.config import settings
from app.db.session import get_db
from app.services.role_service import init_system_roles

app = FastAPI(title="AMANA API", version="0.1.0")
app.add_middleware(RateLimitMiddleware)

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Initialize system roles on startup"""
    try:
        db = next(get_db())
        init_system_roles(db)
        print("✓ System roles initialized")
    except Exception as e:
        print(f"⚠ Warning: Could not initialize system roles: {e}")


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(api_router)
