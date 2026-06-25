import { create } from "zustand";
import type { User } from "../types/models";
import { SessionStorage } from "../services/storage/session";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => Promise<void>;
  setTokens: (access: string, refresh: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: async (user) => {
    if (user) {
      await SessionStorage.setStoredUser(user);
    }
    set({ user, isAuthenticated: !!user });
  },

  setTokens: async (access, refresh) => {
    await Promise.all([
      SessionStorage.setAccessToken(access),
      SessionStorage.setRefreshToken(refresh),
    ]);
  },

  logout: async () => {
    await SessionStorage.clear();
    set({ user: null, isAuthenticated: false });
  },

  hydrate: async () => {
    try {
      const [accessToken, userData] = await Promise.all([
        SessionStorage.getAccessToken(),
        SessionStorage.getStoredUser<User>(),
      ]);

      if (accessToken && userData) {
        set({ user: userData, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
