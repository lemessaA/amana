import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.case import ClaimDisputeCase
from app.models.device import Device, DeviceAssociation, DeviceIdentifier
from app.services.audit_service import log_event
from app.services.imei_service import normalize_imei


def create_dispute(db: Session, user_id: uuid.UUID, identifier_value: str, acquisition_basis: str, description: str) -> ClaimDisputeCase:
    value = identifier_value.strip()
    if value.isdigit():
        value = normalize_imei(value)
    ident = db.execute(select(DeviceIdentifier).where(DeviceIdentifier.normalized_value == value)).scalar_one_or_none()
    if ident is None:
        raise ValueError("unknown device")
    device_id = ident.device_id
    active_assoc = db.execute(
        select(DeviceAssociation).where(DeviceAssociation.device_id == device_id, DeviceAssociation.association_status == "active")
    ).scalar_one_or_none()
    if active_assoc is None:
        raise ValueError("no active association to dispute")

    # never create second active association; hold request in dispute case
    case = ClaimDisputeCase(
        device_id=device_id,
        requester_user_id=user_id,
        case_status="open",
        opened_at=datetime.now(timezone.utc),
        deadline_at=datetime.now(timezone.utc) + timedelta(hours=360),
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    log_event(db, user_id, "claim_dispute_opened", "claim_dispute_case", str(case.id), reason=acquisition_basis)
    db.commit()
    return case


def voluntary_release(db: Session, user_id: uuid.UUID, case_id: uuid.UUID) -> ClaimDisputeCase:
    case = db.get(ClaimDisputeCase, case_id)
    if case is None:
        raise ValueError("case not found")
    if case.case_status != "open":
        raise ValueError("case not open")
    active_assoc = db.execute(
        select(DeviceAssociation).where(DeviceAssociation.device_id == case.device_id, DeviceAssociation.association_status == "active")
    ).scalar_one_or_none()
    if active_assoc is None or active_assoc.user_id != user_id:
        raise ValueError("no releasable association")
    active_assoc.association_status = "ended"
    active_assoc.end_at = datetime.now(timezone.utc)
    active_assoc.end_reason = "voluntary_release_dispute"
    case.case_status = "closed"
    case.outcome = "released_by_claimant"
    case.closed_at = datetime.now(timezone.utc)
    case.outcome_reason = "Voluntary release by current claimant"
    db.commit()
    db.refresh(case)
    log_event(db, user_id, "association_released", "device_association", str(active_assoc.id), reason="dispute")
    log_event(db, user_id, "claim_dispute_closed", "claim_dispute_case", str(case.id))
    db.commit()
    return case
