"""alter categoria: rename parent_id to padre_id, drop codigo

Revision ID: 0002_alter_categoria
Revises: 0001_initial
Create Date: 2026-05-13

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0002_alter_categoria"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop old FK and unique index on codigo
    op.drop_constraint("categoria_parent_id_fkey", "categoria", type_="foreignkey")
    op.drop_index("ix_categoria_codigo", table_name="categoria")

    # Drop codigo column
    op.drop_column("categoria", "codigo")

    # Rename parent_id → padre_id
    op.alter_column("categoria", "parent_id", new_column_name="padre_id")

    # Add FK on padre_id
    op.create_foreign_key(
        "categoria_padre_id_fkey",
        "categoria", "categoria",
        ["padre_id"], ["id"],
        ondelete="RESTRICT",
    )


def downgrade() -> None:
    op.drop_constraint("categoria_padre_id_fkey", "categoria", type_="foreignkey")
    op.alter_column("categoria", "padre_id", new_column_name="parent_id")
    op.add_column("categoria", sa.Column("codigo", sa.String(50), nullable=True))
    op.create_index("ix_categoria_codigo", "categoria", ["codigo"], unique=True)
    op.create_foreign_key(
        "categoria_parent_id_fkey",
        "categoria", "categoria",
        ["parent_id"], ["id"],
    )
