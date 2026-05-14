import { axiosInstance } from '@/shared/api/axiosInstance';
import type { DireccionCreate, DireccionEntrega, DireccionUpdate } from './types';

export const direccionesApi = {
  list: (): Promise<DireccionEntrega[]> =>
    axiosInstance.get<DireccionEntrega[]>('/api/v1/direcciones/').then((r) => r.data),

  create: (data: DireccionCreate): Promise<DireccionEntrega> =>
    axiosInstance.post<DireccionEntrega>('/api/v1/direcciones/', data).then((r) => r.data),

  update: (id: string, data: DireccionUpdate): Promise<DireccionEntrega> =>
    axiosInstance.patch<DireccionEntrega>(`/api/v1/direcciones/${id}`, data).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    axiosInstance.delete(`/api/v1/direcciones/${id}`).then(() => undefined),

  setPredeterminada: (id: string): Promise<DireccionEntrega> =>
    axiosInstance.patch<DireccionEntrega>(`/api/v1/direcciones/${id}/predeterminada`).then((r) => r.data),
};
