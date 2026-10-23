"""Dynamic roles system

Revision ID: dynamic_roles
Revises: 81ed191412bc
Create Date: 2026-10-23 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'dynamic_roles'
down_revision = '81ed191412bc'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create roles table
    op.create_table(
        'roles',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(64), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('permissions', sa.Text(), nullable=False),
        sa.Column('is_system', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_roles_name'), 'roles', ['name'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_roles_name'), table_name='roles')
    op.drop_table('roles')
