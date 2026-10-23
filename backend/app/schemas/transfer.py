from pydantic import BaseModel
import uuid


class InitiateTransferRequest(BaseModel):
    device_id: str
    recipient_user_id: str


class TransferResponse(BaseModel):
    transfer_id: str
    status: str
    expires_at: str
