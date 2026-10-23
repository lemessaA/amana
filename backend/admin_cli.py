#!/usr/bin/env python3
"""
AMANA Admin CLI for managing roles and users
Usage:
  python admin_cli.py list-roles
  python admin_cli.py create-role <name> <description> <permission1> <permission2> ...
  python admin_cli.py assign-role <user_email> <role_name>
  python admin_cli.py list-users
"""

import sys
import argparse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.role_service import (
    get_all_roles, get_role_by_name, create_role, assign_role_to_user
)
from app.services.auth_service import get_user_by_email
from app.schemas.role import RoleCreate
import json


def list_roles():
    """List all roles"""
    db = next(get_db())
    roles = get_all_roles(db)
    print("\n" + "="*80)
    print(f"{'ROLE NAME':<20} {'DESCRIPTION':<30} {'PERMISSIONS':<30} {'SYSTEM':<8}")
    print("="*80)
    for role in roles:
        perms = json.loads(role.permissions)
        perm_str = ", ".join(perms[:2]) + ("..." if len(perms) > 2 else "")
        print(f"{role.name:<20} {(role.description or '')[:30]:<30} {perm_str:<30} {'Yes' if role.is_system else 'No':<8}")
    print("="*80 + "\n")


def create_new_role(name: str, description: str, permissions: list[str]):
    """Create a new role"""
    db = next(get_db())
    try:
        role = create_role(db, RoleCreate(
            name=name,
            description=description,
            permissions=permissions
        ))
        print(f"\n✓ Role '{name}' created successfully")
        print(f"  ID: {role.id}")
        print(f"  Permissions: {', '.join(json.loads(role.permissions))}\n")
    except ValueError as e:
        print(f"\n✗ Error: {e}\n")
        sys.exit(1)


def assign_role(email: str, role_name: str):
    """Assign role to user"""
    db = next(get_db())
    user = get_user_by_email(db, email)
    if not user:
        print(f"\n✗ User '{email}' not found\n")
        sys.exit(1)
    
    role = get_role_by_name(db, role_name)
    if not role:
        print(f"\n✗ Role '{role_name}' not found\n")
        sys.exit(1)
    
    try:
        user = assign_role_to_user(db, str(user.id), role_name)
        print(f"\n✓ Role '{role_name}' assigned to {email}")
        print(f"  Previous login required for changes to take effect\n")
    except ValueError as e:
        print(f"\n✗ Error: {e}\n")
        sys.exit(1)


def list_users():
    """List all users"""
    from app.models.user import User
    db = next(get_db())
    users = db.query(User).all()
    print("\n" + "="*100)
    print(f"{'EMAIL':<30} {'ROLE':<20} {'STATUS':<12} {'CREATED':<25}")
    print("="*100)
    for user in users:
        created = user.created_at.strftime("%Y-%m-%d %H:%M:%S")
        print(f"{user.email:<30} {user.role:<20} {user.account_status:<12} {created:<25}")
    print("="*100 + "\n")


def main():
    parser = argparse.ArgumentParser(description="AMANA Admin CLI")
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # list-roles
    subparsers.add_parser("list-roles", help="List all roles")
    
    # create-role
    create_parser = subparsers.add_parser("create-role", help="Create a new role")
    create_parser.add_argument("name", help="Role name")
    create_parser.add_argument("description", help="Role description")
    create_parser.add_argument("permissions", nargs="+", help="Permissions")
    
    # assign-role
    assign_parser = subparsers.add_parser("assign-role", help="Assign role to user")
    assign_parser.add_argument("email", help="User email")
    assign_parser.add_argument("role_name", help="Role name")
    
    # list-users
    subparsers.add_parser("list-users", help="List all users")
    
    args = parser.parse_args()
    
    if args.command == "list-roles":
        list_roles()
    elif args.command == "create-role":
        create_new_role(args.name, args.description, args.permissions)
    elif args.command == "assign-role":
        assign_role(args.email, args.role_name)
    elif args.command == "list-users":
        list_users()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
