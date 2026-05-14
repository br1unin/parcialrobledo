"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-13

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "rol",
        sa.Column("codigo", sa.String(50), primary_key=True),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "forma_pago",
        sa.Column("codigo", sa.String(50), primary_key=True),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("habilitado", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "estado_pedido",
        sa.Column("codigo", sa.String(50), primary_key=True),
        sa.Column("descripcion", sa.String(255), nullable=False),
        sa.Column("orden", sa.Integer(), nullable=False),
        sa.Column("es_terminal", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "usuario",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("apellido", sa.String(100), nullable=False),
        sa.Column("telefono", sa.String(20), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "usuario_rol",
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("usuario.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("rol_codigo", sa.String(50),
                  sa.ForeignKey("rol.codigo", ondelete="CASCADE"), primary_key=True),
    )

    op.create_table(
        "refresh_token",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("usuario.id"), nullable=False, index=True),
        sa.Column("token_hash", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # categoria with old schema (pre-0002 migration)
    op.create_table(
        "categoria",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("codigo", sa.String(50), unique=True, nullable=False, index=True),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("parent_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("categoria.id"), nullable=True),
        sa.Column("imagen_url", sa.String(500), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "ingrediente",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("codigo", sa.String(50), unique=True, nullable=False, index=True),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("es_alergeno", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "producto",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("codigo", sa.String(50), unique=True, nullable=False, index=True),
        sa.Column("nombre", sa.String(200), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("precio", sa.Numeric(10, 2), nullable=False),
        sa.Column("stock_cantidad", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("imagen_url", sa.String(500), nullable=True),
        sa.Column("disponible", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "producto_categoria",
        sa.Column("producto_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("producto.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("categoria_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("categoria.id", ondelete="CASCADE"), primary_key=True),
    )

    op.create_table(
        "producto_ingrediente",
        sa.Column("producto_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("producto.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("ingrediente_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("ingrediente.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("es_removible", sa.Boolean(), nullable=False, server_default="true"),
    )

    op.create_table(
        "direccion_entrega",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("usuario.id"), nullable=False, index=True),
        sa.Column("calle", sa.String(255), nullable=False),
        sa.Column("numero", sa.String(20), nullable=False),
        sa.Column("departamento", sa.String(50), nullable=True),
        sa.Column("comuna", sa.String(100), nullable=False),
        sa.Column("ciudad", sa.String(100), nullable=False),
        sa.Column("codigo_postal", sa.String(20), nullable=True),
        sa.Column("es_principal", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "pedido",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("usuario.id"), nullable=False),
        sa.Column("direccion_entrega_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("direccion_entrega.id"), nullable=True),
        sa.Column("estado_codigo", sa.String(50),
                  sa.ForeignKey("estado_pedido.codigo"), nullable=False),
        sa.Column("nombre_cliente_snapshot", sa.String(200), nullable=False),
        sa.Column("telefono_snapshot", sa.String(20), nullable=True),
        sa.Column("direccion_snapshot", sa.Text(), nullable=False),
        sa.Column("subtotal", sa.Numeric(10, 2), nullable=False),
        sa.Column("costo_envio", sa.Numeric(10, 2), nullable=False, server_default="50.00"),
        sa.Column("total", sa.Numeric(10, 2), nullable=False),
        sa.Column("notas", sa.Text(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "detalle_pedido",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("pedido_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("pedido.id"), nullable=False),
        sa.Column("producto_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("producto.id"), nullable=False),
        sa.Column("nombre_snapshot", sa.String(200), nullable=False),
        sa.Column("precio_snapshot", sa.Numeric(10, 2), nullable=False),
        sa.Column("cantidad", sa.Integer(), nullable=False),
        sa.Column("personalizacion", postgresql.ARRAY(sa.Integer()), nullable=False, server_default="{}"),
        sa.Column("subtotal", sa.Numeric(10, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "historial_estado_pedido",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("pedido_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("pedido.id"), nullable=False),
        sa.Column("estado_codigo", sa.String(50),
                  sa.ForeignKey("estado_pedido.codigo"), nullable=False),
        sa.Column("observacion", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "pago",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("pedido_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("pedido.id"), nullable=False),
        sa.Column("forma_pago_codigo", sa.String(50),
                  sa.ForeignKey("forma_pago.codigo"), nullable=False),
        sa.Column("monto", sa.Numeric(10, 2), nullable=False),
        sa.Column("mp_payment_id", sa.String(100), unique=True, nullable=True),
        sa.Column("mp_status", sa.String(50), nullable=True),
        sa.Column("mp_status_detail", sa.String(100), nullable=True),
        sa.Column("external_reference", sa.String(100), index=True, nullable=True),
        sa.Column("idempotency_key", sa.String(100), unique=True, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("pago")
    op.drop_table("historial_estado_pedido")
    op.drop_table("detalle_pedido")
    op.drop_table("pedido")
    op.drop_table("direccion_entrega")
    op.drop_table("producto_ingrediente")
    op.drop_table("producto_categoria")
    op.drop_table("producto")
    op.drop_table("ingrediente")
    op.drop_table("categoria")
    op.drop_table("refresh_token")
    op.drop_table("usuario_rol")
    op.drop_table("usuario")
    op.drop_table("estado_pedido")
    op.drop_table("forma_pago")
    op.drop_table("rol")
