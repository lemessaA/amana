from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.notification_service import list_notifications

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
def list_mine(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = list_notifications(db, current.id)
    return [{"id": str(n.id), "channel": n.channel, "type": n.type, "delivery_status": n.delivery_status, "created_at": n.created_at.isoformat()} for n in items]
