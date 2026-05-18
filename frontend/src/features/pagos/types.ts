export interface PreferenceResponse {
  init_point: string;
  preference_id: string;
}

export interface EfectivoResponse {
  pedido_id: string;
  forma_pago: string;
  mensaje: string;
}

export interface TransferenciaResponse {
  pedido_id: string;
  forma_pago: string;
  mensaje: string;
  cbu: string;
  alias: string;
  titular: string;
  banco: string;
  monto: number;
}
