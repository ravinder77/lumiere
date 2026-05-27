import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types/auth';
import {
  loginApi,
  registerApi,
  getMeApi,
  updateProfileApi,
  changePasswordApi,
  setTokens,
  clearTokens,
  getAccessToken,
} from '../lib/authApi';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  initialized: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  updateProfile: (data: Partial<{ name: string; email: string }>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,
      initialized: false,

      login: async (email, password) => {
        set({ loading: true });
        try {
          const res = await loginApi({ email, password });
          if (!res.success || !res.data) throw new Error(res.error ?? 'Login failed');
          setTokens(res.data.accessToken, res.data.refreshToken);
          set({ user: res.data.user, isAuthenticated: true });
        } finally {
          set({ loading: false });
        }
      },

      register: async (name, email, password) => {
        set({ loading: true });
        try {
          const res = await registerApi({ name, email, password });
          if (!res.success || !res.data) throw new Error(res.error ?? 'Registration failed');
          setTokens(res.data.accessToken, res.data.refreshToken);
          set({ user: res.data.user, isAuthenticated: true });
        } finally {
          set({ loading: false });
        }
      },

      logout: () => {
        clearTokens();
        set({ user: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        if (!getAccessToken()) {
          clearTokens();
          set({ user: null, isAuthenticated: false, initialized: true });
          return;
        }
        try {
          const res = await getMeApi();
          if (res.success) set({ user: res.data.user, isAuthenticated: true });
        } catch {
          clearTokens();
          set({ user: null, isAuthenticated: false });
        } finally {
          set({ initialized: true });
        }
      },

      updateProfile: async (data) => {
        const res = await updateProfileApi(data);
        if (res.success && res.data) set({ user: res.data.user });
      },

      changePassword: async (currentPassword, newPassword) => {
        const res = await changePasswordApi({ currentPassword, newPassword });
        if (!res.success) throw new Error(res.error ?? 'Failed to change password');
      },
    }),
    {
      name: 'lumiere-auth',
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
);
