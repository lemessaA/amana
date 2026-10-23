from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.devices import router as devices_router
from app.api.v1.reports import router as reports_router
from app.api.v1.investigations import router as investigations_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(devices_router)
api_router.include_router(reports_router)
api_router.include_router(investigations_router)
