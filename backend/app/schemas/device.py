from pydantic import BaseModel


class RegisterDeviceRequest(BaseModel):
    device_type: str  # phone/computer
    identifier_type: str  # imei/serial
    identifier_value: str


class PublicLookupResponse(BaseModel):
    effective_status: str
    explanation: str
