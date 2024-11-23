import { create } from 'zustand';
import { User } from '../types/index';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  setUser: (user) => set({ user, isAuthenticated: !!user, loading: false }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  logout: () => {
    console.log('Logging out user from auth store');
    set({ user: null, isAuthenticated: false, loading: false, error: null });
  },
  reset: () => set({ user: null, isAuthenticated: false, loading: false, error: null }),
}));
