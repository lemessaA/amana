from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.case import TriageRequest
from app.schemas.case_actions import ExtendRequest
from app.services.case_deadline_service import extend_investigation
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
