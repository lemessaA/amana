import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User
from app.models.case import InvestigationCase, TheftReport
from app.models.device import Restriction
from app.services.audit_service import log_event
from app.services.notification_service import create_notification

SEVENTY_TWO_HOURS = timedelta(hours=72)
ONE_THOUSAND_EIGHTY_HOURS = timedelta(hours=1080)


def _active_reviewers(db: Session, senior_only: bool = False):
    roles = ["senior_reviewer"] if senior_only else ["reviewer", "senior_reviewer"]
    return db.query(User).filter(User.role.in_(roles), User.account_status == "active").all()


def process_investigation_deadlines(db: Session) -> dict:
    now = datetime.now(timezone.utc)
    cases = db.query(InvestigationCase).filter(InvestigationCase.case_status.in_(["open", "investigating"])).all()
    warning_count = 0
    triage_overdue_count = 0
    cap_count = 0
    for case in cases:
        # 72-hour warning before current deadline
        if case.deadline_warning_sent_at is None and (case.deadline_at - now) <= SEVENTY_TWO_HOURS:
            recipients = [case.assigned_reviewer_id] if case.assigned_reviewer_id else [u.id for u in _active_reviewers(db)]
            for rid in recipients:
                if rid is not None:
                    create_notification(db, rid, "investigation_deadline_warning")
            case.deadline_warning_sent_at = now
            db.add(case)
            log_event(db, case.assigned_reviewer_id, "investigation_deadline_warning", "investigation_case", str(case.id))
            warning_count += 1

        # Provisional restrictions not triaged within 72 hours
        if case.triage_overdue_escalated_at is None:
            restriction = db.query(Restriction).filter(
                Restriction.device_id == case.device_id,
                Restriction.source_case_type == "theft",
                Restriction.source_case_id == case.id,
                Restriction.status == "active",
                Restriction.restriction_type == "theft_provisional",
            ).first()
            if restriction is not None and now >= (case.opened_at + SEVENTY_TWO_HOURS):
                for u in _active_reviewers(db, senior_only=True):
                    create_notification(db, u.id, "investigation_triage_overdue")
                case.triage_overdue_escalated_at = now
                db.add(case)
                log_event(db, case.assigned_reviewer_id, "investigation_triage_overdue", "investigation_case", str(case.id))
                triage_overdue_count += 1

        # Absolute 1,080-hour cap: record escalation and require accountable ownership
        if case.cap_escalated_at is None and now >= (case.opened_at + ONE_THOUSAND_EIGHTY_HOURS):
            authority_id = None
            if settings.DESIGNATED_CASE_AUTHORITY_USER_ID:
                try:
                    authority_id = uuid.UUID(settings.DESIGNATED_CASE_AUTHORITY_USER_ID)
                    user = db.get(User, authority_id)
                    if user is None or user.account_status != "active":
                        authority_id = None
                except ValueError:
                    authority_id = None
            if authority_id is not None:
                case.assigned_reviewer_id = authority_id
                db.add(case)
                create_notification(db, authority_id, "case_at_cap_requires_decision")
            else:
                for u in _active_reviewers(db, senior_only=True):
                    create_notification(db, u.id, "case_at_cap_requires_decision")
            case.cap_escalated_at = now
            db.add(case)
            log_event(db, case.assigned_reviewer_id, "investigation_at_cap_escalated", "investigation_case", str(case.id))
            cap_count += 1

    db.commit()
    return {
        "warnings_sent": warning_count,
        "triage_overdue_escalated": triage_overdue_count,
        "cap_escalated": cap_count,
    }
