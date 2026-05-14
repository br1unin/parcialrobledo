export type Rol = {
  codigo: string;
  nombre: string;
  descripcion: string | null;
};

export type FormaPago = {
  codigo: string;
  nombre: string;
  habilitado: boolean;
};

export type EstadoPedido = {
  codigo: string;
  descripcion: string;
  orden: number;
  es_terminal: boolean;
};

export type PedidosPorEstado = {
  estado: string;
  cantidad: number;
};

export type DashboardStats = {
  total_usuarios: number;
  total_productos: number;
  pedidos_por_estado: PedidosPorEstado[];
  ingresos_totales: string;
};
