from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import uuid

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.evidence_service import upload_evidence, review_evidence
from app.services.audit_service import log_event

router = APIRouter(prefix="/evidence", tags=["evidence"])


@router.post("/upload")
async def upload(
    file: UploadFile = File(...),
    claim_id: str | None = Form(None),
    case_id: str | None = Form(None),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cid = uuid.UUID(claim_id) if claim_id else None
    kid = uuid.UUID(case_id) if case_id else None
    ev = await upload_evidence(db, current.id, cid, kid, file)
    log_event(db, current.id, "evidence_submitted", "evidence", str(ev.id))
    db.commit()
    return {"evidence_id": str(ev.id), "review_status": ev.review_status, "file_size": ev.file_size}


@router.post("/{evidence_id}/review")
def review(evidence_id: str, decision: str = Form(...), reason: str = Form(...), current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current.role not in ("reviewer", "senior_reviewer", "system_administrator", "system_admin"):
        raise HTTPException(status_code=403, detail="Reviewer role required")
    try:
        eid = uuid.UUID(evidence_id)
        ev = review_evidence(db, current.id, eid, decision, reason)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    log_event(db, current.id, "evidence_reviewed", "evidence", str(ev.id), reason=decision)
    db.commit()
    return {"evidence_id": str(ev.id), "review_status": ev.review_status}
