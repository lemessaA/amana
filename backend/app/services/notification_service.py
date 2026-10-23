import uuid
from sqlalchemy.orm import Session

from app.models.case import Notification


def create_notification(db: Session, recipient_user_id: uuid.UUID, ntype: str, channel: str = "in_app") -> Notification:
    n = Notification(recipient_user_id=recipient_user_id, channel=channel, type=ntype, delivery_status="pending")
    db.add(n)
    db.commit()
    db.refresh(n)
    return n


def list_notifications(db: Session, user_id: uuid.UUID):
    return db.query(Notification).filter(Notification.recipient_user_id == user_id).order_by(Notification.created_at.desc()).all()
