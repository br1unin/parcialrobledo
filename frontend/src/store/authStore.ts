import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { UserResponse } from '@/shared/types';

type AuthState = {
  accessToken: string | null;
  user: UserResponse | null;
  isAuthenticated: boolean;
  login: (accessToken: string, user: UserResponse) => void;
  logout: () => void;
  updateTokens: (accessToken: string) => void;
  hasRole: (role: string) => boolean;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      login: (accessToken, user) => set({ accessToken, user, isAuthenticated: true }),
      logout: () => set({ accessToken: null, user: null, isAuthenticated: false }),
      updateTokens: (accessToken) => set({ accessToken, isAuthenticated: true }),
      hasRole: (role) => get().user?.roles.includes(role) ?? false,
    }),
    {
      name: 'food-store-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ accessToken: state.accessToken }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          state.isAuthenticated = true;
        }
      },
    },
  ),
);
