import { axiosInstance } from '@/shared/api/axiosInstance';
import type { UserResponse } from '@/shared/types';

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
