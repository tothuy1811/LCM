import { createStore } from "zustand/vanilla";

export type AuthUser = { uid: string; email: string | null } | null;

export type AuthState = {
  user: AuthUser;
  isLoading: boolean;
  setUser: (user: AuthUser) => void;
};

export const createAuthStore = (init?: Partial<AuthState>) =>
  createStore<AuthState>()(set => ({
    user: init?.user ?? null,
    isLoading: init?.isLoading ?? false,
    setUser: user => set({ user, isLoading: false }),
  }));
