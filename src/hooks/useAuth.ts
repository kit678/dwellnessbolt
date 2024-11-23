import { useState, useEffect } from 'react';
import { 
  signInWithPopup,
  signInWithRedirect,
  setPersistence,
  browserSessionPersistence,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { auth } from '../lib/firebase';
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
            setUser(userDoc.data());
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
      } else {
        const result = await signInWithPopup(auth, googleProvider);
        if (result.user) {
          // Handle successful sign-in
          toast.success('Successfully signed in with Google!');
        }
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

  return {
    signInWithGoogle,
    logout,
    loading
  };
}
