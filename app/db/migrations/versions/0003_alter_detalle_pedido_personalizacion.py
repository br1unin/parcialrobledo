"""alter detalle_pedido personalizacion to text array

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-19
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY

revision = '0003'
down_revision = '0002_alter_categoria'
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "ALTER TABLE detalle_pedido ALTER COLUMN personalizacion TYPE TEXT[] USING personalizacion::TEXT[]"
    )


def downgrade():
    op.execute(
        "ALTER TABLE detalle_pedido ALTER COLUMN personalizacion TYPE INTEGER[] USING personalizacion::INTEGER[]"
    )
