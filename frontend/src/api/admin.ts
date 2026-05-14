import { axiosInstance } from '@/shared/api/axiosInstance';
import type { DashboardStats, EstadoPedido, FormaPago, Rol } from '@/types/admin';

export const adminApi = {
  getRoles: (): Promise<Rol[]> =>
    axiosInstance.get<Rol[]>('/api/v1/admin/roles').then((r) => r.data),

  getFormasPago: (): Promise<FormaPago[]> =>
    axiosInstance.get<FormaPago[]>('/api/v1/admin/formas-pago').then((r) => r.data),

  toggleFormaPago: (codigo: string, habilitado: boolean): Promise<FormaPago> =>
    axiosInstance
      .patch<FormaPago>(`/api/v1/admin/formas-pago/${codigo}/habilitado`, { habilitado })
      .then((r) => r.data),

  getEstadosPedido: (): Promise<EstadoPedido[]> =>
    axiosInstance.get<EstadoPedido[]>('/api/v1/admin/estados-pedido').then((r) => r.data),

  getDashboardStats: (): Promise<DashboardStats> =>
    axiosInstance.get<DashboardStats>('/api/v1/admin/dashboard').then((r) => r.data),
};
