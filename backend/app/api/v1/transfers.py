from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.device import DeviceClaim, Transfer
from app.schemas.transfer import InitiateTransferRequest, TransferResponse
from app.services.transfer_service import initiate_transfer, accept_transfer, decline_transfer, cancel_transfer

router = APIRouter(prefix="/transfers", tags=["transfers"])


@router.post("/initiate")
def initiate(data: InitiateTransferRequest, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        device_id = uuid.UUID(data.device_id)
        recipient_id = uuid.UUID(data.recipient_user_id)
        transfer = initiate_transfer(db, current.id, device_id, recipient_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"transfer_id": str(transfer.id), "status": transfer.status, "expires_at": transfer.expires_at.isoformat()}


@router.post("/{transfer_id}/accept")
def accept(transfer_id: str, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        tid = uuid.UUID(transfer_id)
        transfer = accept_transfer(db, tid, current.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"transfer_id": str(transfer.id), "status": transfer.status}


@router.post("/{transfer_id}/decline")
def decline(transfer_id: str, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        tid = uuid.UUID(transfer_id)
        transfer = decline_transfer(db, tid, current.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"transfer_id": str(transfer.id), "status": transfer.status}


@router.post("/{transfer_id}/cancel")
def cancel(transfer_id: str, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        tid = uuid.UUID(transfer_id)
        transfer = db.get(Transfer, tid)
        if transfer is None:
            raise ValueError("transfer not found")
        source_claim = db.get(DeviceClaim, transfer.source_claim_id)
        if source_claim is None or source_claim.claimant_user_id != current.id:
            raise ValueError("not initiator")
        transfer = cancel_transfer(db, tid, current.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"transfer_id": str(transfer.id), "status": transfer.status}
