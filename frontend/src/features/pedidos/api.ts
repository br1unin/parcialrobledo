import { axiosInstance } from '@/shared/api/axiosInstance';

import type {
  EstadoUpdate,
  HistorialResponse,
  PedidoCreate,
  PedidoListResponse,
  PedidoResponse,
} from './types';

export const pedidosApi = {
  list: (page = 1, limit = 10): Promise<PedidoListResponse> =>
    axiosInstance
      .get<PedidoListResponse>('/api/v1/pedidos', { params: { page, limit } })
      .then((r) => r.data),

  get: (id: string): Promise<PedidoResponse> =>
    axiosInstance.get<PedidoResponse>(`/api/v1/pedidos/${id}`).then((r) => r.data),

  create: (data: PedidoCreate): Promise<PedidoResponse> =>
    axiosInstance.post<PedidoResponse>('/api/v1/pedidos', data).then((r) => r.data),

  updateEstado: (id: string, data: EstadoUpdate): Promise<PedidoResponse> =>
    axiosInstance
      .patch<PedidoResponse>(`/api/v1/pedidos/${id}/estado`, data)
      .then((r) => r.data),

  getHistorial: (id: string): Promise<HistorialResponse[]> =>
    axiosInstance
      .get<HistorialResponse[]>(`/api/v1/pedidos/${id}/historial`)
      .then((r) => r.data),
};
