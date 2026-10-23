from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.report import TheftReportRequest
from app.services.report_service import submit_theft_report

router = APIRouter(prefix="/theft-reports", tags=["theft-reports"])


@router.post("")
def create_report(data: TheftReportRequest, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return submit_theft_report(db, current.id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
