from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.case import TriageRequest
from app.services.case_service import triage_case
from app.services.audit_service import log_event

router = APIRouter(prefix="/investigations", tags=["investigations"])


@router.post("/{case_id}/triage")
def triage(case_id: str, data: TriageRequest, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current.role not in ("reviewer", "senior_reviewer", "system_administrator", "system_admin"):
        raise HTTPException(status_code=403, detail="Reviewer role required")
    try:
        uid = uuid.UUID(case_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid case id")
    try:
        case = triage_case(db, current.id, uid, data.outcome, data.reason, data.next_review_days)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    log_event(db, current.id, "investigation_triaged", "investigation_case", str(case.id), reason=data.outcome)
    db.commit()
    return {"case_id": str(case.id), "outcome": case.outcome, "status": case.case_status}
