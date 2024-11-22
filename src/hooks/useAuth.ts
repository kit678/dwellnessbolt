import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signOut,
  browserPopupRedirectResolver,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { User } from '../types/index';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

function clearCookies() {
  const cookies = document.cookie.split(";");

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  }
}

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

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
          toast.error('Error loading user data. Please try again.');
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      unsubscribe();
    };
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
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        const userData: Omit<User, 'id'> = {
          email: user.email!,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          role: 'user'
        };
        await setDoc(doc(db, 'users', user.uid), userData);
        setUser({ id: user.uid, ...userData });
      }
    } catch (error) {
      console.error('Error creating user document:', error);
      toast.error('Failed to create user profile.');
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await setPersistence(auth, browserSessionPersistence);
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
    setLoading(true);
    try {
      await signOut(auth);
      clearCookies();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
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
