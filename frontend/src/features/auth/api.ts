import { axiosInstance } from '@/shared/api/axiosInstance';
import type { TokenResponse } from '@/shared/types';

export type LoginData = { email: string; password: string };
export type RegisterData = {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
};

export const authApi = {
  login: (data: LoginData) =>
    axiosInstance.post<TokenResponse>('/api/v1/auth/login', data).then((r) => r.data),

  register: (data: RegisterData) =>
    axiosInstance.post<TokenResponse>('/api/v1/auth/register', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    axiosInstance
      .post<TokenResponse>('/api/v1/auth/refresh', { refresh_token: refreshToken })
      .then((r) => r.data),

  logout: (refreshToken: string) =>
    axiosInstance.post('/api/v1/auth/logout', { refresh_token: refreshToken }),
};
