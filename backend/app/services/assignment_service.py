import uuid
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.device import DeviceAssociation
from app.models.case import InvestigationCase


def assign_reviewer(db: Session, device_id: uuid.UUID, reporter_user_id: uuid.UUID) -> uuid.UUID | None:
    excluded: set[uuid.UUID] = {reporter_user_id}
    active_claimants = db.execute(
        select(DeviceAssociation.user_id).where(DeviceAssociation.device_id == device_id, DeviceAssociation.association_status == "active")
    ).scalars().all()
    excluded.update(active_claimants)

    reviewers = db.execute(
        select(User).where(User.role.in_(["reviewer", "senior_reviewer"]), User.account_status == "active")
    ).scalars().all()
    eligible = [r for r in reviewers if r.id not in excluded]
    if not eligible:
        return None

    # Least-open-case allocation, tie-broken by UUID for determinism.
    counts = {}
    for reviewer in eligible:
        cnt = db.execute(
            select(func.count(InvestigationCase.id)).where(
                InvestigationCase.assigned_reviewer_id == reviewer.id,
                InvestigationCase.case_status.in_(["open", "investigating"]),
            )
        ).scalar_one()
        counts[reviewer.id] = cnt
    return min(eligible, key=lambda r: (counts[r.id], str(r.id))).id
