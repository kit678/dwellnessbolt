import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  browserPopupRedirectResolver
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { User } from '../types';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          await createUserDocument(user);
          toast.success('Signed in with Google successfully!');
          navigate('/dashboard');
        }
      } catch (error: any) {
        console.error('Redirect result error:', error);
        handleAuthError(error);
      }
    };

    checkRedirectResult();
  }, [navigate]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'id'>;
            setUser({ id: firebaseUser.uid, ...userData });
          } else {
            await createUserDocument(firebaseUser);
          }
        } catch (error: any) {
          console.error('Error fetching user data:', error);
          toast.error('Error loading user data');
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [setUser]);

  const handleAuthError = (error: any) => {
    console.error('Auth error:', error);
    switch (error.code) {
      case 'auth/popup-blocked':
        toast.error('Popup was blocked. Please allow popups or try using redirect.');
        break;
      case 'auth/unauthorized-domain':
        toast.error('This domain is not authorized for authentication.');
        break;
      case 'auth/operation-not-allowed':
        toast.error('This authentication method is not enabled.');
        break;
      case 'auth/email-already-in-use':
        toast.error('An account with this email already exists.');
        navigate('/login');
        break;
      case 'auth/invalid-email':
        toast.error('Invalid email address.');
        break;
      case 'auth/weak-password':
        toast.error('Password should be at least 6 characters.');
        break;
      case 'auth/user-disabled':
        toast.error('This account has been disabled.');
        break;
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        toast.error('Invalid email or password.');
        break;
      default:
        toast.error('Authentication failed. Please try again.');
    }
  };

  const createUserDocument = async (user: any) => {
    try {
      const userData: Omit<User, 'id'> = {
        email: user.email!,
        name: user.displayName || user.email?.split('@')[0] || 'User',
        role: 'user'
      };
      await setDoc(doc(db, 'users', user.uid), userData);
      setUser({ id: user.uid, ...userData });
    } catch (error) {
      console.error('Error creating user document:', error);
      toast.error('Failed to create user profile');
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
      await createUserDocument(result.user);
      toast.success('Signed in successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
        toast.loading('Redirecting to Google Sign-in...');
        await signInWithRedirect(auth, googleProvider);
      } else {
        handleAuthError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      await createUserDocument({ ...firebaseUser, displayName: name });
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  return {
    loading,
    signup,
    login,
    signInWithGoogle,
    logout
  };
}