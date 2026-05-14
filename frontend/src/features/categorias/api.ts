import { axiosInstance } from '@/shared/api/axiosInstance';

import type { CategoriaCreate, CategoriaNode, CategoriaUpdate } from './types';

export const categoriasApi = {
  getTree: (): Promise<CategoriaNode[]> =>
    axiosInstance.get<CategoriaNode[]>('/api/v1/categorias/').then((r) => r.data),

  create: (data: CategoriaCreate): Promise<CategoriaNode> =>
    axiosInstance.post<CategoriaNode>('/api/v1/categorias/', data).then((r) => r.data),

  update: (id: string, data: CategoriaUpdate): Promise<CategoriaNode> =>
    axiosInstance.patch<CategoriaNode>(`/api/v1/categorias/${id}`, data).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    axiosInstance.delete(`/api/v1/categorias/${id}`).then(() => undefined),
};
