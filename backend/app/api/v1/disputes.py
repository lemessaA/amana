from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.dispute import ClaimDisputeRequest
from app.schemas.case_actions import ResolveRequest, ExtendRequest
from app.services.case_deadline_service import extend_claim_dispute
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


@router.post("/{case_id}/resolve")
def resolve_dispute(case_id: str, data: ResolveRequest, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current.role not in ("reviewer", "senior_reviewer", "system_administrator", "system_admin"):
        raise HTTPException(status_code=403, detail="Reviewer role required")
    from app.models.case import ClaimDisputeCase
    try:
        cid = uuid.UUID(case_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid case id")
    case = db.get(ClaimDisputeCase, cid)
    if case is None:
        raise HTTPException(status_code=404, detail="case not found")
    if case.case_status != "open":
        raise HTTPException(status_code=400, detail="case not open")
    case.outcome = data.outcome
    case.outcome_reason = data.reason
    case.case_status = "closed"
    case.closed_at = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
    db.commit()
    db.refresh(case)
    from app.services.audit_service import log_event
    log_event(db, current.id, "claim_dispute_resolved", "claim_dispute_case", str(case.id), reason=data.outcome)
    db.commit()
    return {"case_id": str(case.id), "status": case.case_status, "outcome": case.outcome}


@router.post("/{case_id}/extend")
def extend_dispute(case_id: str, data: ExtendRequest, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current.role not in ("senior_reviewer", "system_administrator", "system_admin"):
        raise HTTPException(status_code=403, detail="Senior reviewer role required")
    try:
        cid = uuid.UUID(case_id)
        case = extend_claim_dispute(db, cid, data.extension_hours)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    from app.services.audit_service import log_event
    log_event(db, current.id, "claim_dispute_extended", "claim_dispute_case", str(case.id), reason=data.reason)
    db.commit()
    return {"case_id": str(case.id), "deadline_at": case.deadline_at.isoformat()}


@router.get("/queue")
def dispute_queue(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current.role not in ("reviewer", "senior_reviewer", "system_administrator", "system_admin"):
        raise HTTPException(status_code=403, detail="Reviewer role required")
    from app.models.case import ClaimDisputeCase
    q = db.query(ClaimDisputeCase).filter(ClaimDisputeCase.case_status == "open")
    if current.role not in ("senior_reviewer", "system_administrator", "system_admin"):
        q = q.filter(ClaimDisputeCase.assigned_reviewer_id == current.id)
    items = q.all()
    return [{"case_id": str(c.id), "device_id": str(c.device_id), "requester_user_id": str(c.requester_user_id), "opened_at": c.opened_at.isoformat(), "deadline_at": c.deadline_at.isoformat()} for c in items]
