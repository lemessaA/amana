from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.account_service import deactivate_account
from app.services.audit_service import log_event

router = APIRouter(prefix="/account", tags=["account"])


@router.post("/deactivate")
def deactivate(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        user = deactivate_account(db, current.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    log_event(db, current.id, "account_deactivated", "user", str(user.id))
    db.commit()
    return {"account_status": user.account_status, "deactivated_at": user.deactivated_at.isoformat() if user.deactivated_at else None}
