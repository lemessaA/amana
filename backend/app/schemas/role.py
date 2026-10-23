from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class RoleCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=64)
    description: Optional[str] = None
    permissions: list[str] = Field(default_factory=list, description="List of permission strings")


class RoleUpdate(BaseModel):
    description: Optional[str] = None
    permissions: Optional[list[str]] = None


class RoleOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    permissions: list[str]
    is_system: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AssignRoleRequest(BaseModel):
    user_id: str
    role_name: str
