import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  signInWithRedirect,
  setPersistence,
  browserSessionPersistence,
  getRedirectResult,
  GoogleAuthProvider,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { User } from '../types/index';
import toast from 'react-hot-toast';

function clearCookies() {
  const cookies = document.cookie.split(";");

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  }
}

function handleAuthError(error: any) {
  console.error('Auth error:', error);
  console.log('Error code:', error.code);
  console.log('Error message:', error.message);
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
}

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const { setUser, logout: storeLogout } = useAuthStore();

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
          if (error.code === 'permission-denied') {
            toast.error('Insufficient permissions to access user data.');
          } else {
            toast.error('Error loading user data. Please try again.');
          }
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [setUser]);

  const createUserDocument = async (user: any) => {
    console.log('Creating/updating user document for:', user.uid);
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      console.log('Existing user document:', userDoc.exists() ? 'found' : 'not found');
      if (!userDoc.exists()) {
        const userData: Omit<User, 'id'> = {
          email: user.email!,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          role: 'user',
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          quizCompleted: false
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
        return false;
      }

      const result = await signInWithPopup(auth, googleProvider);
      await createUserDocument(result.user);
      toast.success('Signed in successfully!');
      return true;
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
        toast.loading('Redirecting to Google Sign-in...');
        await signInWithRedirect(auth, googleProvider);
        return false;
      } else {
        handleAuthError(error);
        return false;
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
    } catch (error: any) {
      handleAuthError(error);
      throw error;
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
    } catch (error: any) {
      handleAuthError(error);
      throw error;
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
      storeLogout();
      window.location.href = '/';
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuizCompletion = async (userId: string) => {
    try {
      await setDoc(doc(db, 'users', userId), { quizCompleted: true }, { merge: true });
      console.log('Quiz completion status updated.');
    } catch (error) {
      console.error('Error updating quiz completion status:', error);
    }
  };

  return {
    loading,
    signup,
    login,
    signInWithGoogle,
    logout,
    updateQuizCompletion
  };
}
