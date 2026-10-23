from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.devices import router as devices_router
from app.api.v1.reports import router as reports_router
from app.api.v1.investigations import router as investigations_router
from app.api.v1.conflicts import router as conflicts_router
from app.api.v1.disputes import router as disputes_router
from app.api.v1.transfers import router as transfers_router
from app.api.v1.evidence import router as evidence_router
from app.api.v1.account import router as account_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.reconsiderations import router as reconsiderations_router
from app.api.v1.roles import router as roles_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(roles_router)
api_router.include_router(devices_router)
api_router.include_router(reports_router)
api_router.include_router(investigations_router)
api_router.include_router(conflicts_router)
api_router.include_router(disputes_router)
api_router.include_router(transfers_router)
api_router.include_router(evidence_router)
api_router.include_router(account_router)
api_router.include_router(notifications_router)
api_router.include_router(reconsiderations_router)
