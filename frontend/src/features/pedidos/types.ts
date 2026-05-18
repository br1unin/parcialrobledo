// snake_case matches backend raw responses (no camelCase transformer in axiosInstance)

export interface ItemCreate {
  producto_id: string;
  cantidad: number;
  personalizacion: number[];
}

export interface PedidoCreate {
  direccion_entrega_id: string;
  items: ItemCreate[];
  notas?: string;
}

export interface DetalleResponse {
  id: string;
  producto_id: string;
  nombre_snapshot: string;
  precio_snapshot: number;
  cantidad: number;
  personalizacion: number[];
  subtotal: number;
}

export interface PedidoResponse {
  id: string;
  usuario_id: string;
  estado_codigo: string;
  nombre_cliente_snapshot: string;
  telefono_snapshot: string | null;
  direccion_snapshot: string;
  subtotal: number;
  costo_envio: number;
  total: number;
  notas: string | null;
  created_at: string;
  updated_at: string;
  detalles: DetalleResponse[];
}

export interface PedidoListItem {
  id: string;
  estado_codigo: string;
  nombre_cliente_snapshot?: string | null;
  total: number;
  created_at: string;
}

export interface PedidoListResponse {
  items: PedidoListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface EstadoUpdate {
  nuevo_estado: string;
  observacion?: string;
}

export interface HistorialResponse {
  id: string;
  estado_codigo: string;
  observacion: string | null;
  created_at: string;
}
