import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { sessionsApi } from '@/api/sessions';
import { useAuthStore } from '@/store/authStore';

const SESSIONS_QUERY_KEY = ['sessions'];

export function useActiveSessions() {
  return useQuery({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: sessionsApi.getActiveSessions,
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tokenId: string) => sessionsApi.revokeSession(tokenId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
    },
  });
}

export function useRevokeAllSessions() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: sessionsApi.revokeAllSessions,
    onSuccess: () => {
      logout();
      navigate('/login', { replace: true });
    },
  });
}
