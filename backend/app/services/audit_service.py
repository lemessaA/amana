import uuid

from sqlalchemy.orm import Session

from app.models.audit import AuditEvent


def log_event(db: Session, actor_id, action: str, target_type: str, target_id: str, reason: str | None = None) -> None:
    db.add(AuditEvent(actor_user_id=actor_id, action=action, target_type=target_type, target_id=str(target_id), reason=reason))
