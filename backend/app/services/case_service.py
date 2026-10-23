import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.case import InvestigationCase
from app.models.device import Restriction

VALID_OUTCOMES = {"substantiated", "unsubstantiated", "invalid", "inconclusive"}


def triage_case(db: Session, user_id: uuid.UUID, case_id: uuid.UUID, outcome: str, reason: str, next_review_days: int | None = None) -> InvestigationCase:
    if outcome not in VALID_OUTCOMES:
        raise ValueError("invalid outcome")
    case = db.get(InvestigationCase, case_id)
    if case is None:
        raise ValueError("case not found")
    if case.case_status not in ("open", "investigating"):
        raise ValueError("case not triageable")

    restriction = db.execute(
        select(Restriction).where(
            Restriction.device_id == case.device_id,
            Restriction.source_case_type == "theft",
            Restriction.source_case_id == case.id,
            Restriction.status == "active",
        )
    ).scalar_one_or_none()

    now = datetime.now(timezone.utc)
    case.outcome = outcome
    case.outcome_reason = reason
    case.case_status = "closed"
    case.closed_at = now

    if outcome in ("unsubstantiated", "invalid"):
        if restriction:
            restriction.status = "ended"
            restriction.ended_at = now
    elif outcome == "substantiated":
        if restriction:
            restriction.restriction_type = "theft_active"
            restriction.reason = reason
            restriction.next_review_at = now + timedelta(days=next_review_days or 30)
    elif outcome == "inconclusive":
        if next_review_days is None or next_review_days > 30:
            raise ValueError("inconclusive requires review date <= 30 days")
        if restriction:
            restriction.restriction_type = "inconclusive"
            restriction.reason = reason
            restriction.next_review_at = now + timedelta(days=next_review_days)

    db.add(case)
    db.commit()
    db.refresh(case)
    return case
