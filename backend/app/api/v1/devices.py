import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.device import PublicLookupResponse, RegisterDeviceRequest
from app.services.device_service import EXPLANATION, lookup_device, register_device, release_association

router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("/register")
def register(data: RegisterDeviceRequest, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        device = register_device(db, current.id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"device_id": str(device.id)}


@router.get("/lookup", response_model=PublicLookupResponse)
def lookup(identifier: str, db: Session = Depends(get_db)):
    status_value = lookup_device(db, identifier)
    return PublicLookupResponse(effective_status=status_value, explanation=EXPLANATION[status_value])


@router.post("/{device_id}/release")
def release(device_id: str, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        did = uuid.UUID(device_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid device id")
    try:
        assoc = release_association(db, current.id, did)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"association_id": str(assoc.id), "status": assoc.association_status}
