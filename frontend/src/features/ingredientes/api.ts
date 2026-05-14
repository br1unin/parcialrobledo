import { axiosInstance } from '@/shared/api/axiosInstance';

import type { Ingrediente, IngredienteCreate, IngredienteListResponse, IngredienteUpdate } from './types';

export const ingredientesApi = {
  list: (params?: { es_alergeno?: boolean; page?: number; limit?: number }): Promise<IngredienteListResponse> =>
    axiosInstance.get<IngredienteListResponse>('/api/v1/ingredientes/', { params }).then((r) => r.data),

  create: (data: IngredienteCreate): Promise<Ingrediente> =>
    axiosInstance.post<Ingrediente>('/api/v1/ingredientes/', data).then((r) => r.data),

  update: (id: string, data: IngredienteUpdate): Promise<Ingrediente> =>
    axiosInstance.patch<Ingrediente>(`/api/v1/ingredientes/${id}`, data).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    axiosInstance.delete(`/api/v1/ingredientes/${id}`).then(() => undefined),
};
