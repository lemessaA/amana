from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_current_user_any_status
from app.db.session import get_db
from app.models.user import User
from app.services.account_service import deactivate_account
from app.models.case import ReconsiderationRequest, ClaimDisputeCase, IdentifierConflictCase, InvestigationCase
from app.models.device import DeviceClaim, Transfer
from sqlalchemy import select
from app.services.audit_service import log_event

router = APIRouter(prefix="/account", tags=["account"])


@router.post("/deactivate")
def deactivate(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        user = deactivate_account(db, current.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    log_event(db, current.id, "account_deactivated", "user", str(user.id))
    db.commit()
    return {"account_status": user.account_status, "deactivated_at": user.deactivated_at.isoformat() if user.deactivated_at else None}


@router.get("/limited-case-access")
def limited_case_access(current: User = Depends(get_current_user_any_status), db: Session = Depends(get_db)):
    if current.account_status != "deactivated":
        raise HTTPException(status_code=403, detail="limited access is for deactivated accounts")
    claims = db.execute(select(DeviceClaim).where(DeviceClaim.claimant_user_id == current.id)).scalars().all()
    device_ids = {c.device_id for c in claims}
    investigations = []
    for did in device_ids:
        for case in db.execute(select(InvestigationCase).where(InvestigationCase.device_id == did)).scalars().all():
            investigations.append({"case_id": str(case.id), "status": case.case_status, "outcome": case.outcome, "deadline_at": case.deadline_at.isoformat()})
    disputes = db.execute(select(ClaimDisputeCase).where(ClaimDisputeCase.requester_user_id == current.id)).scalars().all()
    conflicts = db.execute(select(IdentifierConflictCase).where(IdentifierConflictCase.submitted_by == current.id)).scalars().all()
    recons = db.execute(select(ReconsiderationRequest).where(ReconsiderationRequest.requester_user_id == current.id)).scalars().all()
    transfers = []
    for claim in claims:
        for tr in db.execute(select(Transfer).where(Transfer.source_claim_id == claim.id, Transfer.status == "pending")).scalars().all():
            transfers.append({"transfer_id": str(tr.id), "expires_at": tr.expires_at.isoformat()})
    return {
        "account_status": current.account_status,
        "investigations": investigations,
        "claim_disputes": [{"case_id": str(d.id), "status": d.case_status, "outcome": d.outcome} for d in disputes],
        "identifier_conflicts": [{"case_id": str(c.id), "status": c.case_status, "outcome": c.outcome} for c in conflicts],
        "reconsiderations": [{"id": str(r.id), "status": r.status, "outcome": r.outcome} for r in recons],
        "pending_transfers": transfers,
    }
