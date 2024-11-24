import { create } from 'zustand';
import { User } from '../types/index';
import { auth, googleProvider } from '../lib/firebase';
import { userService } from '../services/userService';
import { signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
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
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Initialize loading state
  set({ loading: true }); // Add missing semicolon

  // Listen to authentication state changes
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // User is signed in
      try {
        const userData = await userService.getUserProfile(firebaseUser.uid);
        if (userData) {
          set({ user: userData, isAuthenticated: true, loading: false });
        } else {
          // Create default user profile
          const defaultUser: User = {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            name: firebaseUser.displayName || '',
            role: 'user',
            authProvider: firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            quizCompleted: false,
            dosha: null,
            secondaryDosha: null,
            quizResults: [],
            lastQuizDate: null,
            bookings: []
          };
          await userService.updateUserProfile(firebaseUser.uid, defaultUser);
          set({ user: defaultUser, isAuthenticated: true, loading: false });
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          set({ error: error.message, loading: false });
        } else {
          set({ error: String(error), loading: false });
        }
        toast.error('Error fetching user profile');
      }
    } else {
      // User is signed out
      set({ user: null, isAuthenticated: false, loading: false });
    }
  });

  return {
    ...initialState,
    login: async (email, password) => {
      console.log('Login initiated');
      set({ loading: true, error: null });
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('User signed in:', userCredential.user.uid);
        if (!userCredential.user.emailVerified) {
          throw new Error('Please verify your email before logging in');
        }
        const userData = await userService.getUserProfile(userCredential.user.uid);
        if (userData) {
          set({ user: userData, isAuthenticated: true });
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          set({ error: error.message });
          toast.error(error.message);
        } else {
          set({ error: String(error) });
          toast.error(String(error));
        }
      } finally {
        console.log('Login process completed');
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message });
        toast.error(error.message);
      } else {
        set({ error: String(error) });
        toast.error(String(error));
      }
    } finally {
      console.log('Signup process completed');
      set({ loading: false });
    }
  },
  signInWithGoogle: async () => {
    set({ loading: true });
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Successfully signed in with Google!');
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message });
        toast.error('Failed to sign in with Google. Please try again.');
      } else {
        set({ error: String(error) });
        toast.error('Failed to sign in with Google. Please try again.');
      }
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message });
        toast.error('Failed to log out. Please try again.');
      } else {
        set({ error: String(error) });
        toast.error('Failed to log out. Please try again.');
      }
    } finally {
      set({ loading: false });
    }
  },
  resetPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent! Please check your inbox.');
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message });
        toast.error(error.message);
      } else {
        set({ error: String(error) });
        toast.error(String(error));
      }
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message });
        toast.error(error.message);
      } else {
        set({ error: String(error) });
        toast.error(String(error));
      }
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message });
        toast.error(error.message);
      } else {
        set({ error: String(error) });
        toast.error(String(error));
      }
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message });
        toast.error('Error updating user profile');
      } else {
        set({ error: String(error) });
        toast.error('Error updating user profile');
      }
    }
  },
  setUser: (user) => set({ user, isAuthenticated: !!user, loading: false }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
});

