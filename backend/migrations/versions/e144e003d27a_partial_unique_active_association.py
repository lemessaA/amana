"""partial unique active association"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e144e003d27a'
down_revision: Union[str, Sequence[str], None] = 'c9fe387bc244'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from sqlalchemy import text
    op.create_index(
        "uq_active_assoc_per_device",
        "device_associations",
        ["device_id"],
        unique=True,
        postgresql_where=text("association_status = 'active'"),
    )


def downgrade() -> None:
    op.drop_index("uq_active_assoc_per_device", table_name="device_associations")
