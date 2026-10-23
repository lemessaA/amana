import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit import AuditEvent
from app.models.device import Device, DeviceAssociation, DeviceClaim, DeviceIdentifier, Restriction
from app.schemas.device import RegisterDeviceRequest
from app.services.audit_service import log_event
from app.services.imei_service import normalize_imei, validate_imei


def effective_public_status(restrictions: list[Restriction]) -> str:
    types = {r.restriction_type for r in restrictions if r.status == "active"}
    if "theft_provisional" in types:
        return "Under review"
    if "theft_active" in types:
        return "Active theft restriction"
    if "inconclusive" in types:
        return "Restricted pending further review"
    if {"dispute", "identifier_conflict"} & types:
        return "Restricted pending review"
    return "No active theft restriction found"


EXPLANATION = {
    "Under review": "A device report is under review. AMANA does not determine legal ownership.",
    "Active theft restriction": "An active theft restriction exists. AMANA does not determine legal ownership.",
    "Restricted pending further review": "A restriction is retained pending further review.",
    "Restricted pending review": "A review is pending. AMANA does not determine legal ownership.",
    "No active theft restriction found": "No active theft restriction found in AMANA records. This is not a guarantee of safety or ownership.",
}


def register_device(db: Session, user_id: uuid.UUID, data: RegisterDeviceRequest) -> Device:
    if data.identifier_type == "imei":
        if not validate_imei(data.identifier_value):
            raise ValueError("invalid IMEI")
        normalized = normalize_imei(data.identifier_value)
    else:
        normalized = data.identifier_value.strip()

    existing = db.execute(
        select(DeviceIdentifier).where(DeviceIdentifier.normalized_value == normalized)
    ).scalar_one_or_none()
    if existing is not None:
        raise ValueError("identifier already registered")

    device = Device(device_type=data.device_type)
    db.add(device)
    db.flush()

    ident = DeviceIdentifier(device_id=device.id, identifier_type=data.identifier_type, normalized_value=normalized)
    db.add(ident)

    claim = DeviceClaim(device_id=device.id, claimant_user_id=user_id, receipt_status="receipt-free", acquisition_basis="other/unverified")
    db.add(claim)
    db.flush()

    assoc = DeviceAssociation(device_id=device.id, claim_id=claim.id, user_id=user_id, association_status="active")
    db.add(assoc)

    log_event(db, user_id, "device_registered", "device", str(device.id))
    db.commit()
    db.refresh(device)
    return device


def lookup_device(db: Session, identifier_value: str) -> str:
    normalized = identifier_value.strip()
    if identifier_value.strip().isdigit():
        from app.services.imei_service import normalize_imei

        normalized = normalize_imei(identifier_value)
    ident = db.execute(
        select(DeviceIdentifier).where(DeviceIdentifier.normalized_value == normalized)
    ).scalar_one_or_none()
    if ident is None:
        return "No active theft restriction found"
    restrictions = db.execute(
        select(Restriction).where(Restriction.device_id == ident.device_id)
    ).scalars().all()
    return effective_public_status(list(restrictions))
