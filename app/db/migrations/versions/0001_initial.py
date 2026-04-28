"""0001_initial

Revision ID: 0001_initial
Revises:
Create Date: 2026-04-28
"""

from collections.abc import Sequence

import sqlalchemy as sa
import sqlmodel
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "rol",
        sa.Column("codigo", sa.String(length=50), nullable=False),
        sa.Column("nombre", sa.String(length=100), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("codigo"),
    )
    op.create_table(
        "forma_pago",
        sa.Column("codigo", sa.String(length=50), nullable=False),
        sa.Column("nombre", sa.String(length=100), nullable=False),
        sa.Column("habilitado", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("codigo"),
    )
    op.create_table(
        "estado_pedido",
        sa.Column("codigo", sa.String(length=50), nullable=False),
        sa.Column("descripcion", sa.String(length=255), nullable=False),
        sa.Column("orden", sa.Integer(), nullable=False),
        sa.Column("es_terminal", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("codigo"),
    )
    op.create_table(
        "usuario",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("nombre", sa.String(length=100), nullable=False),
        sa.Column("apellido", sa.String(length=100), nullable=False),
        sa.Column("telefono", sa.String(length=20), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_usuario_email"), "usuario", ["email"], unique=True)
    op.create_table(
        "categoria",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("codigo", sa.String(length=50), nullable=False),
        sa.Column("nombre", sa.String(length=100), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("parent_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("imagen_url", sa.String(length=500), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["parent_id"], ["categoria.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_categoria_codigo"), "categoria", ["codigo"], unique=True)
    op.create_table(
        "producto",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("codigo", sa.String(length=50), nullable=False),
        sa.Column("nombre", sa.String(length=200), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("precio", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("stock_cantidad", sa.Integer(), nullable=False),
        sa.Column("imagen_url", sa.String(length=500), nullable=True),
        sa.Column("disponible", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_producto_codigo"), "producto", ["codigo"], unique=True)
    op.create_table(
        "ingrediente",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("codigo", sa.String(length=50), nullable=False),
        sa.Column("nombre", sa.String(length=100), nullable=False),
        sa.Column("es_alergeno", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ingrediente_codigo"), "ingrediente", ["codigo"], unique=True)
    op.create_table(
        "usuario_rol",
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("rol_codigo", sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(["rol_codigo"], ["rol.codigo"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuario.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("usuario_id", "rol_codigo"),
    )
    op.create_table(
        "refresh_token",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token_hash", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuario.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_refresh_token_token_hash"), "refresh_token", ["token_hash"], unique=True)
    op.create_index(op.f("ix_refresh_token_usuario_id"), "refresh_token", ["usuario_id"], unique=False)
    op.create_table(
        "direccion_entrega",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("calle", sa.String(length=255), nullable=False),
        sa.Column("numero", sa.String(length=20), nullable=False),
        sa.Column("departamento", sa.String(length=50), nullable=True),
        sa.Column("comuna", sa.String(length=100), nullable=False),
        sa.Column("ciudad", sa.String(length=100), nullable=False),
        sa.Column("codigo_postal", sa.String(length=20), nullable=True),
        sa.Column("es_principal", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuario.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_direccion_entrega_usuario_id"), "direccion_entrega", ["usuario_id"], unique=False)
    op.create_table(
        "producto_categoria",
        sa.Column("producto_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("categoria_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["categoria_id"], ["categoria.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["producto_id"], ["producto.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("producto_id", "categoria_id"),
    )
    op.create_table(
        "producto_ingrediente",
        sa.Column("producto_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("ingrediente_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("es_removible", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["ingrediente_id"], ["ingrediente.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["producto_id"], ["producto.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("producto_id", "ingrediente_id"),
    )
    op.create_table(
        "pedido",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("direccion_entrega_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("estado_codigo", sa.String(length=50), nullable=False),
        sa.Column("nombre_cliente_snapshot", sa.String(length=200), nullable=False),
        sa.Column("telefono_snapshot", sa.String(length=20), nullable=True),
        sa.Column("direccion_snapshot", sa.Text(), nullable=False),
        sa.Column("subtotal", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("costo_envio", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("total", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("notas", sa.Text(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["direccion_entrega_id"], ["direccion_entrega.id"]),
        sa.ForeignKeyConstraint(["estado_codigo"], ["estado_pedido.codigo"]),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuario.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "detalle_pedido",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("pedido_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("producto_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("nombre_snapshot", sa.String(length=200), nullable=False),
        sa.Column("precio_snapshot", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("cantidad", sa.Integer(), nullable=False),
        sa.Column("personalizacion", postgresql.ARRAY(sa.Integer()), nullable=False),
        sa.Column("subtotal", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["pedido_id"], ["pedido.id"]),
        sa.ForeignKeyConstraint(["producto_id"], ["producto.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "historial_estado_pedido",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("pedido_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("estado_codigo", sa.String(length=50), nullable=False),
        sa.Column("observacion", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["estado_codigo"], ["estado_pedido.codigo"]),
        sa.ForeignKeyConstraint(["pedido_id"], ["pedido.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "pago",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("pedido_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("forma_pago_codigo", sa.String(length=50), nullable=False),
        sa.Column("monto", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("mp_payment_id", sa.String(length=100), nullable=True),
        sa.Column("mp_status", sa.String(length=50), nullable=True),
        sa.Column("mp_status_detail", sa.String(length=100), nullable=True),
        sa.Column("external_reference", sa.String(length=100), nullable=True),
        sa.Column("idempotency_key", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["forma_pago_codigo"], ["forma_pago.codigo"]),
        sa.ForeignKeyConstraint(["pedido_id"], ["pedido.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("idempotency_key"),
        sa.UniqueConstraint("mp_payment_id"),
    )
    op.create_index(op.f("ix_pago_external_reference"), "pago", ["external_reference"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_pago_external_reference"), table_name="pago")
    op.drop_table("pago")
    op.drop_table("historial_estado_pedido")
    op.drop_table("detalle_pedido")
    op.drop_table("pedido")
    op.drop_table("producto_ingrediente")
    op.drop_table("producto_categoria")
    op.drop_index(op.f("ix_direccion_entrega_usuario_id"), table_name="direccion_entrega")
    op.drop_table("direccion_entrega")
    op.drop_index(op.f("ix_refresh_token_usuario_id"), table_name="refresh_token")
    op.drop_index(op.f("ix_refresh_token_token_hash"), table_name="refresh_token")
    op.drop_table("refresh_token")
    op.drop_table("usuario_rol")
    op.drop_index(op.f("ix_ingrediente_codigo"), table_name="ingrediente")
    op.drop_table("ingrediente")
    op.drop_index(op.f("ix_producto_codigo"), table_name="producto")
    op.drop_table("producto")
    op.drop_index(op.f("ix_categoria_codigo"), table_name="categoria")
    op.drop_table("categoria")
    op.drop_index(op.f("ix_usuario_email"), table_name="usuario")
    op.drop_table("usuario")
    op.drop_table("estado_pedido")
    op.drop_table("forma_pago")
    op.drop_table("rol")
