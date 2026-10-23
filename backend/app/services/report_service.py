import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.case import InvestigationCase, TheftReport
from app.models.device import DeviceIdentifier, Restriction
from app.services.audit_service import log_event
from app.services.assignment_service import assign_reviewer
from app.services.notification_service import create_notification
from app.services.notification_service import create_notification
from app.services.imei_service import normalize_imei


def submit_theft_report(db: Session, user_id: uuid.UUID, data) -> dict:
    identifier = data.identifier_value.strip()
    if identifier.isdigit():
        identifier = normalize_imei(identifier)
    ident = db.execute(
        select(DeviceIdentifier).where(DeviceIdentifier.normalized_value == identifier)
    ).scalar_one_or_none()
    if ident is None:
        raise ValueError("unknown device identifier")

    device_id = ident.device_id
    try:
        active_case = db.execute(
            select(InvestigationCase).where(
                InvestigationCase.device_id == device_id,
                InvestigationCase.case_status.in_(["open", "investigating"]),
            )
        ).scalar_one_or_none()

        duplicate = active_case is not None
        if not duplicate:
            case = InvestigationCase(
                device_id=device_id,
                case_status="open",
                opened_at=datetime.now(timezone.utc),
                deadline_at=datetime.now(timezone.utc) + timedelta(hours=720),
            )
            db.add(case)
            db.flush()
            assigned = assign_reviewer(db, device_id, user_id)
            case.assigned_reviewer_id = assigned
            if assigned is not None:
                create_notification(db, assigned, "case_assigned_for_review")

            restriction = Restriction(
                device_id=device_id,
                restriction_type="theft_provisional",
                source_case_type="theft",
                source_case_id=case.id,
                reason="Provisional restriction from theft report",
                status="active",
                next_review_at=datetime.now(timezone.utc) + timedelta(hours=72),
            )
            db.add(restriction)
        else:
            case = active_case

        report = TheftReport(
            device_id=device_id,
            reporter_user_id=user_id,
            allegation_category=data.allegation_category,
            description=data.description,
            incident_period=data.incident_period,
            screening_status="duplicate_linked" if duplicate else "passed",
            case_id=case.id,
        )
        db.add(report)
        db.flush()

        create_notification(db, user_id, "theft_report_received")
        log_event(db, user_id, "theft_report_submitted", "theft_report", str(report.id), reason=data.allegation_category)
        if not duplicate:
            log_event(db, user_id, "investigation_opened", "investigation_case", str(case.id))
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {"report_id": str(report.id), "case_id": str(case.id), "duplicate": duplicate, "deadline_at": case.deadline_at.isoformat()}
