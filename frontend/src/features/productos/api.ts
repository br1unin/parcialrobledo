import { axiosInstance } from '@/shared/api/axiosInstance';

import type { IngredienteAsignado, Producto, ProductoCreate, ProductoListResponse, ProductoUpdate } from './types';

interface ListParams {
  page?: number;
  limit?: number;
  categoria_id?: string;
  busqueda?: string;
  excluir_alergenos?: string;
}

export const productosApi = {
  list: (params?: ListParams): Promise<ProductoListResponse> =>
    axiosInstance.get<ProductoListResponse>('/api/v1/productos/', { params }).then((r) => r.data),

  get: (id: string): Promise<Producto> =>
    axiosInstance.get<Producto>(`/api/v1/productos/${id}`).then((r) => r.data),

  create: (data: ProductoCreate): Promise<Producto> =>
    axiosInstance.post<Producto>('/api/v1/productos/', data).then((r) => r.data),

  update: (id: string, data: ProductoUpdate): Promise<Producto> =>
    axiosInstance.patch<Producto>(`/api/v1/productos/${id}`, data).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    axiosInstance.delete(`/api/v1/productos/${id}`).then(() => undefined),

  adjustStock: (id: string, delta: number): Promise<Producto> =>
    axiosInstance.patch<Producto>(`/api/v1/productos/${id}/stock`, { delta }).then((r) => r.data),

  setCategorias: (id: string, categoria_ids: string[]): Promise<Producto> =>
    axiosInstance.put<Producto>(`/api/v1/productos/${id}/categorias`, { categoria_ids }).then((r) => r.data),

  setIngredientes: (id: string, ingredientes: IngredienteAsignado[]): Promise<Producto> =>
    axiosInstance.put<Producto>(`/api/v1/productos/${id}/ingredientes`, { ingredientes }).then((r) => r.data),
};
