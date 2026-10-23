import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session


def _extend(case, hours: int, max_hours: int, cap_hours: int):
    if case.extension_deadline_at is not None:
        raise ValueError("extension already used")
    if hours <= 0 or hours > max_hours:
        raise ValueError("invalid extension hours")
    now = datetime.now(timezone.utc)
    proposed = case.deadline_at + timedelta(hours=hours)
    cap = case.opened_at + timedelta(hours=cap_hours)
    if proposed > cap:
        raise ValueError("extension exceeds cap")
    case.extension_deadline_at = proposed
    case.deadline_at = proposed
    return case


def extend_investigation(db: Session, case_id: uuid.UUID, hours: int):
    from app.models.case import InvestigationCase
    case = db.get(InvestigationCase, case_id)
    if case is None:
        raise ValueError("case not found")
    if case.case_status not in ("open", "investigating"):
        raise ValueError("case not open")
    _extend(case, hours, 360, 1080)
    db.commit(); db.refresh(case)
    return case


def extend_identifier_conflict(db: Session, case_id: uuid.UUID, hours: int):
    from app.models.case import IdentifierConflictCase
    case = db.get(IdentifierConflictCase, case_id)
    if case is None:
        raise ValueError("case not found")
    if case.case_status != "open":
        raise ValueError("case not open")
    _extend(case, hours, 168, 528)
    db.commit(); db.refresh(case)
    return case


def extend_claim_dispute(db: Session, case_id: uuid.UUID, hours: int):
    from app.models.case import ClaimDisputeCase
    case = db.get(ClaimDisputeCase, case_id)
    if case is None:
        raise ValueError("case not found")
    if case.case_status != "open":
        raise ValueError("case not open")
    _extend(case, hours, 168, 528)
    db.commit(); db.refresh(case)
    return case
