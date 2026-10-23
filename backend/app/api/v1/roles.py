from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Annotated

from app.api.dependencies import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.role import RoleCreate, RoleUpdate, RoleOut, AssignRoleRequest
from app.services.role_service import (
    create_role, get_all_roles, get_role_by_name,
    update_role, delete_role, assign_role_to_user, get_role_permissions
)

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("", response_model=list[RoleOut])
def list_roles(
    db: Annotated[Session, Depends(get_db)]
):
    """List all available roles (public)"""
    roles = get_all_roles(db)
    return [
        RoleOut(
            id=str(role.id),
            name=role.name,
            description=role.description,
            permissions=__parse_permissions(role.permissions),
            is_system=role.is_system,
            created_at=role.created_at,
            updated_at=role.updated_at
        )
        for role in roles
    ]


@router.get("/{role_name}", response_model=RoleOut)
def get_role(
    role_name: str,
    db: Annotated[Session, Depends(get_db)]
):
    """Get role details"""
    role = get_role_by_name(db, role_name)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    return RoleOut(
        id=str(role.id),
        name=role.name,
        description=role.description,
        permissions=__parse_permissions(role.permissions),
        is_system=role.is_system,
        created_at=role.created_at,
        updated_at=role.updated_at
    )


@router.post("", response_model=RoleOut, status_code=201)
def create_new_role(
    data: RoleCreate,
    current: Annotated[User, Depends(require_role(["admin"]))],
    db: Annotated[Session, Depends(get_db)]
):
    """Create a new role (admin only)"""
    try:
        role = create_role(db, data)
        return RoleOut(
            id=str(role.id),
            name=role.name,
            description=role.description,
            permissions=__parse_permissions(role.permissions),
            is_system=role.is_system,
            created_at=role.created_at,
            updated_at=role.updated_at
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{role_name}", response_model=RoleOut)
def update_existing_role(
    role_name: str,
    data: RoleUpdate,
    current: Annotated[User, Depends(require_role(["admin"]))],
    db: Annotated[Session, Depends(get_db)]
):
    """Update a role (admin only)"""
    role = get_role_by_name(db, role_name)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    try:
        updated_role = update_role(db, str(role.id), data)
        return RoleOut(
            id=str(updated_role.id),
            name=updated_role.name,
            description=updated_role.description,
            permissions=__parse_permissions(updated_role.permissions),
            is_system=updated_role.is_system,
            created_at=updated_role.created_at,
            updated_at=updated_role.updated_at
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{role_name}", status_code=204)
def delete_existing_role(
    role_name: str,
    current: Annotated[User, Depends(require_role(["admin"]))],
    db: Annotated[Session, Depends(get_db)]
):
    """Delete a role (admin only)"""
    role = get_role_by_name(db, role_name)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    try:
        delete_role(db, str(role.id))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/assign", response_model=dict)
def assign_role(
    data: AssignRoleRequest,
    current: Annotated[User, Depends(require_role(["admin"]))],
    db: Annotated[Session, Depends(get_db)]
):
    """Assign a role to a user (admin only)"""
    try:
        user = assign_role_to_user(db, data.user_id, data.role_name)
        return {"message": f"Role '{data.role_name}' assigned to user {user.email}"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{role_name}/permissions", response_model=dict)
def get_permissions(
    role_name: str,
    db: Annotated[Session, Depends(get_db)]
):
    """Get permissions for a role"""
    perms = get_role_permissions(db, role_name)
    return {"role": role_name, "permissions": perms}


def __parse_permissions(permissions_json: str) -> list[str]:
    """Parse JSON permissions string"""
    import json
    try:
        return json.loads(permissions_json)
    except:
        return []
