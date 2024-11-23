import { useState, useEffect } from 'react';
import { 
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { userService } from '../services/userService';
import { User } from '../types';
import toast from 'react-hot-toast';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const { setUser, logout: storeLogout } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          // Fetch user data and set user state
          const userData = await userService.getUserProfile(firebaseUser.uid);
          if (userData) {
            setUser(userData);
          } else {
            // Create default user profile if it doesn't exist
            const defaultUser: User = {
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              name: firebaseUser.displayName || '',
              role: 'user',
              quizCompleted: false,
              dosha: null,
              secondaryDosha: null,
            };
            setUser(defaultUser);
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Successfully signed in!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Successfully signed in with Google!');
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      storeLogout();
      toast.success('Logged out successfully.');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (uid: string, data: Partial<User>) => {
    try {
      await userService.updateUserProfile(uid, data);
      const updatedUser = await userService.getUserProfile(uid);
      if (updatedUser) {
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  return {
    login,
    signInWithGoogle,
    logout,
    loading,
    user: useAuthStore.getState().user,
    updateUserProfile
  };
}
