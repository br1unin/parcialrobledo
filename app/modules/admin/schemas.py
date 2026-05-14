from decimal import Decimal

from pydantic import BaseModel


class RolRead(BaseModel):
    codigo: str
    nombre: str
    descripcion: str | None = None

    model_config = {"from_attributes": True}


class FormaPagoRead(BaseModel):
    codigo: str
    nombre: str
    habilitado: bool

    model_config = {"from_attributes": True}


class FormaPagoToggleRequest(BaseModel):
    habilitado: bool


class EstadoPedidoRead(BaseModel):
    codigo: str
    descripcion: str
    orden: int
    es_terminal: bool

    model_config = {"from_attributes": True}


class PedidosPorEstado(BaseModel):
    estado: str
    cantidad: int


class DashboardStats(BaseModel):
    total_usuarios: int
    total_productos: int
    pedidos_por_estado: list[PedidosPorEstado]
    ingresos_totales: Decimal
