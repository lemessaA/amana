import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.case import IdentifierConflictCase
from app.models.device import DeviceIdentifier
from app.services.audit_service import log_event
from app.services.imei_service import normalize_imei


def submit_identifier_conflict(db: Session, user_id: uuid.UUID, identifier_value: str) -> IdentifierConflictCase:
    value = identifier_value.strip()
    if value.isdigit():
        value = normalize_imei(value)
    existing = db.execute(
        select(DeviceIdentifier).where(DeviceIdentifier.normalized_value == value)
    ).scalar_one_or_none()
    if existing is None:
        raise ValueError("no conflicting identifier")
    case = IdentifierConflictCase(
        device_identifier_id=existing.id,
        submitted_by=user_id,
        existing_device_id=existing.device_id,
        case_status="open",
        opened_at=datetime.now(timezone.utc),
        deadline_at=datetime.now(timezone.utc) + timedelta(hours=360),
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    log_event(db, user_id, "identifier_conflict_submitted", "identifier_conflict_case", str(case.id))
    db.commit()
    return case
