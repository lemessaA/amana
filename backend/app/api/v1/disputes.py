from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.dispute import ClaimDisputeRequest
from app.services.dispute_service import create_dispute, voluntary_release

router = APIRouter(prefix="/claim-disputes", tags=["claim-disputes"])


@router.post("")
def open_dispute(data: ClaimDisputeRequest, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        case = create_dispute(db, current.id, data.identifier_value, data.acquisition_basis, data.description)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"case_id": str(case.id), "status": case.case_status, "deadline_at": case.deadline_at.isoformat()}


@router.post("/{case_id}/release")
def release(case_id: str, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        uid = uuid.UUID(case_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid case id")
    try:
        case = voluntary_release(db, current.id, uid)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"case_id": str(case.id), "status": case.case_status, "outcome": case.outcome}
