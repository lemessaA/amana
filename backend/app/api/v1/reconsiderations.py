from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.reconsideration import ReconsiderationRequestSchema, ReconsiderationDecisionSchema
from app.services.reconsideration_service import create_reconsideration, decide_reconsideration

router = APIRouter(prefix="/reconsiderations", tags=["reconsiderations"])


@router.post("")
def submit(data: ReconsiderationRequestSchema, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        case_id = uuid.UUID(data.case_id)
        req = create_reconsideration(db, current.id, data.case_type, case_id, data.reason)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"request_id": str(req.id), "status": req.status}


@router.get("")
def list_mine(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.models.case import ReconsiderationRequest
    items = db.query(ReconsiderationRequest).filter(ReconsiderationRequest.requester_user_id == current.id).all()
    return [{"id": str(r.id), "case_type": r.case_type, "case_id": str(r.case_id), "status": r.status, "outcome": r.outcome, "submitted_at": r.submitted_at.isoformat()} for r in items]


@router.post("/{request_id}/decide")
def decide(request_id: str, data: ReconsiderationDecisionSchema, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current.role not in ("senior_reviewer", "system_administrator", "system_admin"):
        raise HTTPException(status_code=403, detail="Senior reviewer role required")
    try:
        rid = uuid.UUID(request_id)
        req = decide_reconsideration(db, current.id, rid, data.outcome, data.reason)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"request_id": str(req.id), "status": req.status, "outcome": req.outcome}
