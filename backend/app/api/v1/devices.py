import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.device import Device, DeviceAssociation, DeviceIdentifier, DeviceClaim
from app.schemas.device import PublicLookupResponse, RegisterDeviceRequest
from app.services.device_service import EXPLANATION, lookup_device, register_device, release_association
from app.services.audit_service import log_event

router = APIRouter(prefix="/devices", tags=["devices"])


@router.get("/my-devices")
def get_my_devices(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all devices registered or claimed by current user"""
    try:
        # Get all active associations for the user
        associations = db.execute(
            select(DeviceAssociation).where(
                DeviceAssociation.user_id == current.id,
                DeviceAssociation.association_status == "active"
            )
        ).scalars().all()
        
        devices = []
        for assoc in associations:
            device = db.get(Device, assoc.device_id)
            if device:
                # Get device identifier
                identifier = db.execute(
                    select(DeviceIdentifier).where(
                        DeviceIdentifier.device_id == device.id
                    )
                ).scalar_one_or_none()
                
                devices.append({
                    "device_id": str(device.id),
                    "device_type": device.device_type,
                    "identifier": {
                        "identifier_id": str(identifier.id) if identifier else None,
                        "identifier_type": identifier.identifier_type if identifier else None,
                        "identifier_value": identifier.normalized_value if identifier else None,
                    } if identifier else None,
                    "association_id": str(assoc.id),
                    "association_status": assoc.association_status,
                    "created_at": assoc.start_at.isoformat() if assoc.start_at else None,
                })
        
        return {"devices": devices, "total": len(devices)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/register")
def register(data: RegisterDeviceRequest, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        device = register_device(db, current.id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"device_id": str(device.id)}


@router.post("/register-test")
def register_test(data: RegisterDeviceRequest, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    TEST MODE: Register device with ANY identifier (bypasses IMEI validation).
    Use this for testing with arbitrary IMEI/Serial numbers.
    """
    try:
        from app.models.device import Device, DeviceIdentifier, DeviceClaim, DeviceAssociation
        from app.services.audit_service import log_event
        from datetime import datetime, timezone
        
        # Bypass IMEI validation - accept any value
        normalized = data.identifier_value.strip()
        
        # Check if identifier already exists
        existing = db.execute(
            select(DeviceIdentifier).where(DeviceIdentifier.normalized_value == normalized)
        ).scalar_one_or_none()
        if existing is not None:
            raise ValueError("identifier already registered")
        
        # Create device without validation
        device = Device(device_type=data.device_type)
        db.add(device)
        db.flush()
        
        ident = DeviceIdentifier(
            device_id=device.id, 
            identifier_type=data.identifier_type, 
            normalized_value=normalized
        )
        db.add(ident)
        
        claim = DeviceClaim(
            device_id=device.id, 
            claimant_user_id=current.id, 
            receipt_status="receipt-free", 
            acquisition_basis="test/mode"
        )
        db.add(claim)
        db.flush()
        
        assoc = DeviceAssociation(
            device_id=device.id, 
            claim_id=claim.id, 
            user_id=current.id, 
            association_status="active"
        )
        db.add(assoc)
        
        log_event(db, current.id, "device_registered_test", "device", str(device.id))
        db.commit()
        db.refresh(device)
        
        return {
            "device_id": str(device.id),
            "test_mode": True,
            "identifier_value": normalized
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
