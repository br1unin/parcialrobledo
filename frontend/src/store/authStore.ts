import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { UserResponse } from '@/shared/types';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserResponse | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, user: UserResponse) => void;
  logout: () => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (user: UserResponse) => void;
  hasRole: (role: string) => boolean;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      login: (accessToken, refreshToken, user) =>
        set({ accessToken, refreshToken, user, isAuthenticated: true }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false }),
      updateTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, isAuthenticated: true }),
      updateUser: (user) => set({ user }),
      hasRole: (role) => get().user?.roles.includes(role) ?? false,
    }),
    {
      name: 'food-store-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          state.isAuthenticated = true;
        }
      },
    },
  ),
);
