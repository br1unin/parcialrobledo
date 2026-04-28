import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '@/store/authStore';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type RefreshResponse = {
  accessToken: string;
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

    try {
      const response = await axiosInstance.post<RefreshResponse>('/api/v1/auth/refresh');
      useAuthStore.getState().updateTokens(response.data.accessToken);
      originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    }
  },
);
