import { useState, useEffect } from 'react';
import { 
  signInWithPopup,
  signInWithRedirect,
  setPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

// Initialize GoogleAuthProvider
const googleProvider = new GoogleAuthProvider();

function handleAuthError(error: any) {
  console.error('Auth error:', error);
  switch (error.code) {
    case 'auth/popup-blocked':
      toast.error('Popup was blocked. Please allow popups or try using redirect.');
      break;
    // ... other cases ...
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
          // Fetch user data and set it in the store
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Transform Firestore data to User type
            const user = {
              id: userDoc.id,
              uid: firebaseUser.uid,
              email: userData.email || firebaseUser.email || '',
              name: userData.displayName || firebaseUser.displayName || '',
              displayName: userData.displayName || firebaseUser.displayName || '',
              role: userData.role || 'user',
              quizCompleted: userData.quizCompleted || false,
              dosha: userData.dosha || null
            };
            setUser(user);
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [setUser]);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await setPersistence(auth, browserSessionPersistence);
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile) {
        await signInWithRedirect(auth, googleProvider);
        return false; // Redirect flow initiated
      } else {
        const result = await signInWithPopup(auth, googleProvider);
        if (result.user) {
          toast.success('Successfully signed in with Google!');
          return true;
        }
        return false;
      }
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
      storeLogout();
      toast.success('Logged out successfully.');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to log out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await setPersistence(auth, browserSessionPersistence);
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (result.user) {
        toast.success('Successfully signed in!');
      }
      return true;
    } catch (error: any) {
      handleAuthError(error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    signInWithGoogle,
    logout,
    loading
  };
}
