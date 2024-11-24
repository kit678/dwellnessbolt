import { create } from 'zustand';
import { User } from '../types/index';
import { auth, googleProvider } from '../lib/firebase';
import { userService } from '../services/userService';
import { signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import toast from 'react-hot-toast';

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  updateUserProfile: (uid: string, data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        throw new Error('Please verify your email before logging in');
      }
      const userData = await userService.getUserProfile(userCredential.user.uid);
      if (userData) {
        set({ user: userData, isAuthenticated: true });
      }
    } catch (error) {
      set({ error: error.message });
      toast.error(error.message);
    } finally {
      set({ loading: false });
    }
  },
  signup: async (email, password, displayName) => {
    set({ loading: true, error: null });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      await sendEmailVerification(userCredential.user);
      toast.success('Account created! Please check your email for verification.');
    } catch (error) {
      set({ error: error.message });
      toast.error(error.message);
    } finally {
      set({ loading: false });
    }
  },
  signInWithGoogle: async () => {
    set({ loading: true });
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Successfully signed in with Google!');
    } catch (error) {
      set({ error: error.message });
      toast.error('Failed to sign in with Google. Please try again.');
    } finally {
      set({ loading: false });
    }
  },
  logout: async () => {
    set({ loading: true });
    try {
      await signOut(auth);
      set({ user: null, isAuthenticated: false });
      toast.success('Logged out successfully.');
    } catch (error) {
      set({ error: error.message });
      toast.error('Failed to log out. Please try again.');
    } finally {
      set({ loading: false });
    }
  },
  resetPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent! Please check your inbox.');
    } catch (error) {
      set({ error: error.message });
      toast.error(error.message);
    } finally {
      set({ loading: false });
    }
  },
  updateUserPassword: async (currentPassword, newPassword) => {
    set({ loading: true, error: null });
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('No user logged in');
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast.success('Password updated successfully');
    } catch (error) {
      set({ error: error.message });
      toast.error(error.message);
    } finally {
      set({ loading: false });
    }
  },
  resendVerificationEmail: async () => {
    set({ loading: true, error: null });
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');
      await sendEmailVerification(user);
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      set({ error: error.message });
      toast.error(error.message);
    } finally {
      set({ loading: false });
    }
  },
  updateUserProfile: async (uid, data) => {
    try {
      await userService.updateUserProfile(uid, data);
      const updatedUser = await userService.getUserProfile(uid);
      if (updatedUser) {
        set({ user: updatedUser });
      }
    } catch (error) {
      set({ error: error.message });
      toast.error('Error updating user profile');
    }
  },
  setUser: (user) => set({ user, isAuthenticated: !!user, loading: false }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
