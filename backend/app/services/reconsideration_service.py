import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.case import ClaimDisputeCase, IdentifierConflictCase, InvestigationCase, ReconsiderationRequest
from app.services.audit_service import log_event
from app.services.notification_service import create_notification

CASE_MODELS = {
    "investigation": InvestigationCase,
    "identifier_conflict": IdentifierConflictCase,
    "claim_dispute": ClaimDisputeCase,
}


def create_reconsideration(db: Session, user_id: uuid.UUID, case_type: str, case_id: uuid.UUID, reason: str) -> ReconsiderationRequest:
    model = CASE_MODELS.get(case_type)
    if model is None:
        raise ValueError("invalid case type")
    case = db.get(model, case_id)
    if case is None:
        raise ValueError("case not found")
    if getattr(case, "case_status", None) != "closed":
        raise ValueError("case not closed")
    closed_at = case.closed_at
    if closed_at is None or closed_at < datetime.now(timezone.utc) - timedelta(days=30):
        raise ValueError("reconsideration window expired")
    existing = db.execute(
        select(ReconsiderationRequest).where(
            ReconsiderationRequest.case_type == case_type,
            ReconsiderationRequest.case_id == case_id,
            ReconsiderationRequest.status == "pending",
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise ValueError("pending reconsideration exists")

    req = ReconsiderationRequest(case_type=case_type, case_id=case_id, requester_user_id=user_id, reason=reason, status="pending")
    db.add(req)
    db.commit()
    db.refresh(req)
    create_notification(db, user_id, "reconsideration_submitted")
    log_event(db, user_id, "reconsideration_submitted", "reconsideration_request", str(req.id))
    db.commit()
    return req


def decide_reconsideration(db: Session, reviewer_id: uuid.UUID, request_id: uuid.UUID, outcome: str, reason: str) -> ReconsiderationRequest:
    req = db.get(ReconsiderationRequest, request_id)
    if req is None:
        raise ValueError("request not found")
    if req.status != "pending":
        raise ValueError("request not pending")
    if req.submitted_at + timedelta(days=10) < datetime.now(timezone.utc) and False:
        pass
    req.status = "decided"
    req.outcome = outcome
    req.decision_at = datetime.now(timezone.utc)
    req.assigned_reviewer_id = reviewer_id
    db.commit()
    db.refresh(req)
    create_notification(db, req.requester_user_id, f"reconsideration_{outcome}")
    log_event(db, reviewer_id, "reconsideration_decided", "reconsideration_request", str(req.id), reason=outcome)
    db.commit()
    return req
