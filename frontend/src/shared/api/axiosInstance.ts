import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '@/store/authStore';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type RefreshResponse = {
  access_token: string;
  refresh_token: string;
};

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      useAuthStore.getState().logout();
      window.location.replace('/login');
      return Promise.reject(error);
    }

    try {
      const response = await axiosInstance.post<RefreshResponse>('/api/v1/auth/refresh', {
        refresh_token: refreshToken,
      });
      const { access_token, refresh_token } = response.data;
      useAuthStore.getState().updateTokens(access_token, refresh_token);
      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().logout();
      window.location.replace('/login');
      return Promise.reject(refreshError);
    }
  },
);
