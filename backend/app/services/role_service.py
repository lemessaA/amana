import json
import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.role import Role
from app.models.user import User
from app.schemas.role import RoleCreate, RoleUpdate


def create_role(db: Session, data: RoleCreate) -> Role:
    """Create a new role"""
    existing = db.execute(select(Role).where(Role.name == data.name)).scalar_one_or_none()
    if existing:
        raise ValueError(f"Role '{data.name}' already exists")
    
    role = Role(
        name=data.name,
        description=data.description,
        permissions=json.dumps(data.permissions),
        is_system=False
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def get_role_by_name(db: Session, name: str) -> Role | None:
    """Get a role by name"""
    return db.execute(select(Role).where(Role.name == name)).scalar_one_or_none()


def get_all_roles(db: Session) -> list[Role]:
    """Get all roles"""
    return db.execute(select(Role)).scalars().all()


def update_role(db: Session, role_id: str, data: RoleUpdate) -> Role:
    """Update a role"""
    try:
        rid = uuid.UUID(role_id)
    except ValueError:
        raise ValueError("Invalid role ID")
    
    role = db.get(Role, rid)
    if not role:
        raise ValueError("Role not found")
    
    if role.is_system:
        raise ValueError("Cannot modify system roles")
    
    if data.description is not None:
        role.description = data.description
    if data.permissions is not None:
        role.permissions = json.dumps(data.permissions)
    
    db.commit()
    db.refresh(role)
    return role


def delete_role(db: Session, role_id: str) -> bool:
    """Delete a role"""
    try:
        rid = uuid.UUID(role_id)
    except ValueError:
        raise ValueError("Invalid role ID")
    
    role = db.get(Role, rid)
    if not role:
        raise ValueError("Role not found")
    
    if role.is_system:
        raise ValueError("Cannot delete system roles")
    
    # Check if role is assigned to users
    users_with_role = db.execute(select(User).where(User.role == role.name)).scalars().all()
    if users_with_role:
        raise ValueError(f"Cannot delete role '{role.name}' - {len(users_with_role)} users still have this role")
    
    db.delete(role)
    db.commit()
    return True


def assign_role_to_user(db: Session, user_id: str, role_name: str) -> User:
    """Assign a role to a user"""
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise ValueError("Invalid user ID")
    
    user = db.get(User, uid)
    if not user:
        raise ValueError("User not found")
    
    role = get_role_by_name(db, role_name)
    if not role:
        raise ValueError(f"Role '{role_name}' not found")
    
    user.role = role_name
    db.commit()
    db.refresh(user)
    return user


def get_role_permissions(db: Session, role_name: str) -> list[str]:
    """Get permissions for a role"""
    role = get_role_by_name(db, role_name)
    if not role:
        return []
    return json.loads(role.permissions)


def init_system_roles(db: Session) -> None:
    """Initialize default system roles"""
    default_roles = [
        {
            "name": "claimant",
            "description": "Regular user who can register devices and submit claims",
            "permissions": ["device:register", "report:create", "dispute:create", "conflict:create"],
            "is_system": True
        },
        {
            "name": "reviewer",
            "description": "Staff member who reviews and triages cases",
            "permissions": ["investigation:view", "investigation:triage", "case:extend", "case:reopen"],
            "is_system": True
        },
        {
            "name": "senior_reviewer",
            "description": "Senior staff who makes final decisions on disputes",
            "permissions": ["investigation:view", "investigation:triage", "dispute:resolve", "case:extend", "case:reopen"],
            "is_system": True
        },
        {
            "name": "admin",
            "description": "System administrator with full access",
            "permissions": ["*"],  # All permissions
            "is_system": True
        }
    ]
    
    for role_data in default_roles:
        existing = get_role_by_name(db, role_data["name"])
        if not existing:
            role = Role(
                name=role_data["name"],
                description=role_data["description"],
                permissions=json.dumps(role_data["permissions"]),
                is_system=role_data["is_system"]
            )
            db.add(role)
    
    db.commit()
