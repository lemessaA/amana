from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.case import TriageRequest
from app.schemas.case_actions import ReopenRequest
from app.schemas.case_actions import ExtendRequest
from app.services.case_deadline_service import extend_investigation
from app.services.deadline_service import process_investigation_deadlines
from app.models.case import InvestigationCase, TheftReport
from app.models.device import Restriction
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
    from app.models.device import DeviceAssociation
    from app.models.case import TheftReport, InvestigationCase
    case_obj = db.get(InvestigationCase, uid)
    if case_obj is not None:
        excluded = set()
        reports = db.query(TheftReport).filter(TheftReport.device_id == case_obj.device_id).all()
        excluded.update(r.reporter_user_id for r in reports)
        claimants = db.query(DeviceAssociation.user_id).filter(DeviceAssociation.device_id == case_obj.device_id, DeviceAssociation.association_status == "active").all()
        excluded.update(u for (u,) in claimants)
        if current.id in excluded:
            raise HTTPException(status_code=403, detail="Reviewer has a system-detectable conflict")
    try:
        case = triage_case(db, current.id, uid, data.outcome, data.reason, data.next_review_days)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    log_event(db, current.id, "investigation_triaged", "investigation_case", str(case.id), reason=data.outcome)
    db.commit()
    return {"case_id": str(case.id), "outcome": case.outcome, "status": case.case_status}


@router.post("/{case_id}/extend")
def extend_investigation_endpoint(case_id: str, data: ExtendRequest, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current.role not in ("senior_reviewer", "system_administrator", "system_admin"):
        raise HTTPException(status_code=403, detail="Senior reviewer role required")
    try:
        cid = uuid.UUID(case_id)
        case = extend_investigation(db, cid, data.extension_hours)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    from app.services.audit_service import log_event
    log_event(db, current.id, "investigation_extended", "investigation_case", str(case.id), reason=data.reason)
    db.commit()
    return {"case_id": str(case.id), "deadline_at": case.deadline_at.isoformat()}


@router.get("/queue")
def reviewer_queue(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current.role not in ("reviewer", "senior_reviewer", "system_administrator", "system_admin"):
        raise HTTPException(status_code=403, detail="Reviewer role required")
    now = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
    q = db.query(InvestigationCase)
    if current.role not in ("senior_reviewer", "system_administrator", "system_admin"):
        q = q.filter(InvestigationCase.assigned_reviewer_id == current.id)
    cases = q.filter(InvestigationCase.case_status.in_(["open", "investigating"])).all()
    return [
        {
            "case_id": str(c.id),
            "device_id": str(c.device_id),
            "assigned_reviewer_id": str(c.assigned_reviewer_id) if c.assigned_reviewer_id else None,
            "opened_at": c.opened_at.isoformat(),
            "deadline_at": c.deadline_at.isoformat(),
            "remaining_hours": round((c.deadline_at - now).total_seconds() / 3600, 2),
            "has_provisional_restriction": db.query(Restriction).filter(Restriction.source_case_type == "theft", Restriction.source_case_id == c.id, Restriction.status == "active", Restriction.restriction_type == "theft_provisional").count() > 0,
            "triage_due_at": (c.opened_at + __import__("datetime").timedelta(hours=72)).isoformat(),
        }
        for c in cases
    ]


@router.get("/{case_id}")
def get_case(case_id: str, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current.role not in ("reviewer", "senior_reviewer", "system_administrator", "system_admin"):
        raise HTTPException(status_code=403, detail="Reviewer role required")
    try:
        cid = __import__("uuid").UUID(case_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid case id")
    case = db.get(InvestigationCase, cid)
    if case is None:
        raise HTTPException(status_code=404, detail="case not found")
    if current.role not in ("senior_reviewer", "system_administrator", "system_admin") and case.assigned_reviewer_id != current.id:
        raise HTTPException(status_code=403, detail="not assigned")
    reports = db.query(TheftReport).filter(TheftReport.device_id == case.device_id).all()
    restrictions = db.query(Restriction).filter(Restriction.device_id == case.device_id, Restriction.status == "active").all()
    return {
        "case_id": str(case.id),
        "device_id": str(case.device_id),
        "status": case.case_status,
        "outcome": case.outcome,
        "opened_at": case.opened_at.isoformat(),
        "deadline_at": case.deadline_at.isoformat(),
        "reports": [{"id": str(r.id), "category": r.allegation_category, "description": r.description, "screening_status": r.screening_status} for r in reports],
        "restrictions": [{"type": r.restriction_type, "reason": r.reason, "next_review_at": r.next_review_at.isoformat() if r.next_review_at else None} for r in restrictions],
    }


@router.post("/{case_id}/reopen")
def reopen_investigation(case_id: str, data: ReopenRequest, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current.role not in ("senior_reviewer", "system_administrator", "system_admin"):
        raise HTTPException(status_code=403, detail="Senior reviewer role required")
    reason = data.reason
    if not reason:
        raise HTTPException(status_code=400, detail="reason required")
    from app.models.case import InvestigationCase
    import uuid, datetime as dt
    try:
        cid = uuid.UUID(case_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid case id")
    case = db.get(InvestigationCase, cid)
    if case is None:
        raise HTTPException(status_code=404, detail="case not found")
    if case.case_status != "closed":
        raise HTTPException(status_code=400, detail="case not closed")
    prior_outcome = case.outcome
    prior_reason = case.outcome_reason
    now = dt.datetime.now(dt.timezone.utc)
    case.case_status = "open"
    case.closed_at = None
    case.outcome = None
    case.outcome_reason = f"Reopened: {reason} (prior outcome: {prior_outcome}; prior reason: {prior_reason})"
    case.opened_at = now
    case.deadline_at = now + dt.timedelta(hours=720)
    case.extension_deadline_at = None
    db.add(case)
    if data.apply_provisional_restriction:
        from app.models.device import Restriction
        r = Restriction(device_id=case.device_id, restriction_type="theft_provisional", source_case_type="theft", source_case_id=case.id, reason=f"Provisional restriction from reopening: {reason}", status="active", next_review_at=now + dt.timedelta(hours=72))
        db.add(r)
    db.commit()
    db.refresh(case)
    from app.services.audit_service import log_event
    log_event(db, current.id, "investigation_reopened", "investigation_case", str(case.id), reason=reason)
    db.commit()
    return {"case_id": str(case.id), "status": case.case_status, "opened_at": case.opened_at.isoformat(), "deadline_at": case.deadline_at.isoformat()}


@router.post("/process-deadlines")
def process_deadlines(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current.role not in ("senior_reviewer", "system_administrator", "system_admin"):
        raise HTTPException(status_code=403, detail="Senior reviewer role required")
    summary = process_investigation_deadlines(db)
    return summary
