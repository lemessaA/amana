import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.device import DeviceAssociation, DeviceClaim, Restriction, Transfer
from app.models.case import ClaimDisputeCase, InvestigationCase
from app.models.user import User


def _active_assoc_for_user(db: Session, user_id: uuid.UUID):
    return db.execute(
        select(DeviceAssociation).where(DeviceAssociation.user_id == user_id, DeviceAssociation.association_status == "active")
    ).scalars().all()


def deactivate_account(db: Session, user_id: uuid.UUID) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise ValueError("user not found")
    if user.account_status != "active":
        raise ValueError("account not active")

    assocs = _active_assoc_for_user(db, user_id)
    device_ids = {a.device_id for a in assocs}

    # Blocking holds
    for device_id in device_ids:
        inv = db.execute(
            select(InvestigationCase).where(
                InvestigationCase.device_id == device_id,
                InvestigationCase.case_status.in_(["open", "investigating"]),
            )
        ).scalar_one_or_none()
        if inv is not None:
            raise ValueError("blocked: active investigation as affected claimant")

        dispute = db.execute(
            select(ClaimDisputeCase).where(
                ClaimDisputeCase.device_id == device_id,
                ClaimDisputeCase.case_status == "open",
            )
        ).scalar_one_or_none()
        if dispute is not None:
            raise ValueError("blocked: active claim dispute")

    # pending transfer initiated by this user
    pending_transfers = db.execute(select(Transfer).where(Transfer.status == "pending")).scalars().all()
    for t in pending_transfers:
        source_claim = db.get(DeviceClaim, t.source_claim_id)
        if source_claim is not None and source_claim.claimant_user_id == user_id:
            raise ValueError("blocked: pending transfer initiated")

    # Apply deactivation
    now = datetime.now(timezone.utc)
    user.account_status = "deactivated"
    user.deactivated_at = now

    for assoc in assocs:
        restrictions = db.execute(
            select(Restriction).where(Restriction.device_id == assoc.device_id, Restriction.status == "active")
        ).scalars().all()
        if restrictions:
            # Retain restricted association with its resolution path/review date.
            continue
        assoc.association_status = "ended"
        assoc.end_at = now
        assoc.end_reason = "account_deactivated"

    db.commit()
    db.refresh(user)
    return user
