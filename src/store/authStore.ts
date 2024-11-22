import { create } from 'zustand';
import { User } from '../types/index';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => {
    console.log('Logging out user from auth store');
    set({ user: null, isAuthenticated: false });
  },
  reset: () => set({ user: null, isAuthenticated: false }),
}));