from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.conflict import IdentifierConflictRequest
from app.services.conflict_service import submit_identifier_conflict

router = APIRouter(prefix="/identifier-conflicts", tags=["identifier-conflicts"])


@router.post("")
def create_conflict(data: IdentifierConflictRequest, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        case = submit_identifier_conflict(db, current.id, data.identifier_value)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"case_id": str(case.id), "status": case.case_status, "deadline_at": case.deadline_at.isoformat()}
