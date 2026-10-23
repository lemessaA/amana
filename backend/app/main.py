from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.rate_limit import RateLimitMiddleware

from app.api.v1 import api_router
from app.core.config import settings

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


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(api_router)
