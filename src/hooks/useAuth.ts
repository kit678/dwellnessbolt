import { useState, useEffect } from 'react';
import { 
  signInWithPopup,
  signInWithRedirect,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

function handleAuthError(error: any) {
  console.error('Auth error:', error);
  switch (error.code) {
    case 'auth/popup-blocked':
      toast.error('Popup was blocked. Please allow popups or try using redirect.');
      break;
    case 'auth/cancelled-popup-request':
      // Silent handling as this is a user action
      console.log('User closed the popup');
      break;
    case 'auth/popup-closed-by-user':
      // Silent handling as this is a user action  
      console.log('User closed the popup');
      break;
    case 'auth/account-exists-with-different-credential':
      toast.error('An account already exists with this email using a different sign-in method.');
      break;
    case 'auth/network-request-failed':
      toast.error('Network error. Please check your connection and try again.');
      break;
    default:
      toast.error('Authentication failed. Please try again.');
      console.error('Unhandled auth error:', error);
  }
}

export function useAuth(): { 
  login: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
} {
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
      console.log('Starting Google sign-in process...');
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      console.log('Device type:', isMobile ? 'mobile' : 'desktop');

      if (isMobile) {
        console.log('Using redirect flow for mobile');
        await signInWithRedirect(auth, googleProvider);
        return false; // Redirect flow initiated
      } else {
        console.log('Using popup flow for desktop');
        console.log('Browser details:', {
          userAgent: navigator.userAgent,
          vendor: navigator.vendor,
          platform: navigator.platform,
          language: navigator.language,
        });
        console.log('Window dimensions:', {
          inner: { width: window.innerWidth, height: window.innerHeight },
          outer: { width: window.outerWidth, height: window.outerHeight },
        });
        console.log('Popup settings:', {
          provider: googleProvider.providerId,
        });
        
        console.log('Attempting to open popup...');
        const result = await signInWithPopup(auth, googleProvider);
        console.log('Popup completed successfully');
        
        if (result.user) {
          console.log('Google sign-in successful:', result.user.email);
          toast.success('Successfully signed in with Google!');
          return true;
        }
        console.log('No user returned from Google sign-in');
        return false;
      }
    } catch (error: any) {
      console.log('Google sign-in error:', error.code);
      handleAuthError(error);
      return false;
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
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (result.user) {
        toast.success('Successfully signed in!');
        return true;
      }
      return false;
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
