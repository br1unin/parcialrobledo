import { axiosInstance } from '@/shared/api/axiosInstance';
import type { UserResponse } from '@/shared/types';
import type { AdminUserListResponse } from '@/types/admin';

export type UpdateProfileData = {
  nombre?: string | null;
  apellido?: string | null;
  telefono?: string | null;
};

export type ChangePasswordData = {
  current_password: string;
  new_password: string;
};

export const usuariosApi = {
  getMe: (): Promise<UserResponse> =>
    axiosInstance.get<UserResponse>('/api/v1/usuarios/me').then((r) => r.data),

  updateMe: (data: UpdateProfileData): Promise<UserResponse> =>
    axiosInstance.patch<UserResponse>('/api/v1/usuarios/me', data).then((r) => r.data),

  changePassword: (data: ChangePasswordData): Promise<void> =>
    axiosInstance.patch('/api/v1/usuarios/me/password', data).then(() => undefined),

  deleteMe: (): Promise<void> =>
    axiosInstance.delete('/api/v1/usuarios/me').then(() => undefined),
};

export const adminUsuariosApi = {
  listUsers: (skip: number, limit: number): Promise<AdminUserListResponse> =>
    axiosInstance
      .get<AdminUserListResponse>(`/api/v1/usuarios/?skip=${skip}&limit=${limit}`)
      .then((r) => r.data),

  getUser: (id: string): Promise<UserResponse> =>
    axiosInstance.get<UserResponse>(`/api/v1/usuarios/${id}`).then((r) => r.data),

  setActive: (id: string, is_active: boolean): Promise<UserResponse> =>
    axiosInstance
      .patch<UserResponse>(`/api/v1/usuarios/${id}/activo`, { is_active })
      .then((r) => r.data),

  assignRole: (id: string, rol_codigo: string): Promise<UserResponse> =>
    axiosInstance
      .post<UserResponse>(`/api/v1/usuarios/${id}/roles`, { rol_codigo })
      .then((r) => r.data),

  removeRole: (id: string, rol: string): Promise<UserResponse> =>
    axiosInstance
      .delete<UserResponse>(`/api/v1/usuarios/${id}/roles/${rol}`)
      .then((r) => r.data),
};
