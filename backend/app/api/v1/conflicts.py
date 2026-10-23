from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.conflict import IdentifierConflictRequest
from app.schemas.case_actions import ResolveRequest, ExtendRequest
from app.services.case_deadline_service import extend_identifier_conflict
from app.services.conflict_service import submit_identifier_conflict

router = APIRouter(prefix="/identifier-conflicts", tags=["identifier-conflicts"])


@router.post("")
def create_conflict(data: IdentifierConflictRequest, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        case = submit_identifier_conflict(db, current.id, data.identifier_value)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"case_id": str(case.id), "status": case.case_status, "deadline_at": case.deadline_at.isoformat()}


@router.post("/{case_id}/resolve")
def resolve_conflict(case_id: str, data: ResolveRequest, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current.role not in ("reviewer", "senior_reviewer", "system_administrator", "system_admin"):
        raise HTTPException(status_code=403, detail="Reviewer role required")
    from app.models.case import IdentifierConflictCase
    try:
        cid = uuid.UUID(case_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid case id")
    case = db.get(IdentifierConflictCase, cid)
    if case is None:
        raise HTTPException(status_code=404, detail="case not found")
    if case.case_status != "open":
        raise HTTPException(status_code=400, detail="case not open")
    allowed = {"duplicate", "data_entry_error", "legitimate_additional_identifier", "unresolved_conflict"}
    if data.outcome not in allowed:
        raise HTTPException(status_code=400, detail="invalid outcome")
    case.outcome = data.outcome
    case.outcome_reason = data.reason
    case.case_status = "closed"
    case.closed_at = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
    if data.outcome == "unresolved_conflict" and (data.next_review_days is None or data.next_review_days > 30):
        raise HTTPException(status_code=400, detail="next review date required")
    if data.outcome == "unresolved_conflict":
        case.next_review_at = __import__("datetime").datetime.now(__import__("datetime").timezone.utc) + __import__("datetime").timedelta(days=data.next_review_days)
    db.commit()
    db.refresh(case)
    from app.services.audit_service import log_event
    log_event(db, current.id, "identifier_conflict_resolved", "identifier_conflict_case", str(case.id), reason=data.outcome)
    db.commit()
    return {"case_id": str(case.id), "status": case.case_status, "outcome": case.outcome}


@router.post("/{case_id}/extend")
def extend_conflict(case_id: str, data: ExtendRequest, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current.role not in ("senior_reviewer", "system_administrator", "system_admin"):
        raise HTTPException(status_code=403, detail="Senior reviewer role required")
    try:
        cid = uuid.UUID(case_id)
        case = extend_identifier_conflict(db, cid, data.extension_hours)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    from app.services.audit_service import log_event
    log_event(db, current.id, "identifier_conflict_extended", "identifier_conflict_case", str(case.id), reason=data.reason)
    db.commit()
    return {"case_id": str(case.id), "deadline_at": case.deadline_at.isoformat()}
