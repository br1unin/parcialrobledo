import { axiosInstance } from '@/shared/api/axiosInstance';

export type SessionResponse = {
  id: string;
  created_at: string;
  expires_at: string;
};

export const sessionsApi = {
  getActiveSessions: (): Promise<SessionResponse[]> =>
    axiosInstance.get<SessionResponse[]>('/api/v1/auth/sessions').then((r) => r.data),

  revokeSession: (tokenId: string): Promise<void> =>
    axiosInstance.delete(`/api/v1/auth/sessions/${tokenId}`).then(() => undefined),

  revokeAllSessions: (): Promise<void> =>
    axiosInstance.delete('/api/v1/auth/sessions').then(() => undefined),
};
