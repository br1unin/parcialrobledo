import { Navigate } from 'react-router-dom';

import { useAuthStore } from '@/store/authStore';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasRole = useAuthStore((s) => s.hasRole);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasRole('ADMIN')) return <Navigate to="/" replace />;

  return <>{children}</>;
}
