import { useState, useEffect } from 'react';
import { 
  signInWithPopup,
  signInWithRedirect,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  getRedirectResult
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { AUTH_ERROR_CODES, BROWSER_DETECTION } from '../constants/auth';
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
    let isMounted = true;
    const { setLoading, setError } = useAuthStore.getState();

    // Handle redirect result
    const handleRedirectResult = async () => {
      if (sessionStorage.getItem('googleSignInRedirect')) {
        try {
          setLoading(true);
          const result = await getRedirectResult(auth);
          if (result?.user) {
            console.log('Redirect sign-in successful:', result.user.email);
            toast.success('Successfully signed in with Google!');
          }
        } catch (error: any) {
          console.error('Redirect sign-in error:', error);
          handleAuthError(error);
        } finally {
          sessionStorage.removeItem('googleSignInRedirect');
          if (isMounted) setLoading(false);
        }
      }
    };

    // Handle auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;
      
      setLoading(true);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
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
            if (isMounted) setUser(user);
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          if (isMounted) setError('Failed to fetch user data');
        }
      } else {
        if (isMounted) setUser(null);
      }
      if (isMounted) setLoading(false);
    });

    handleRedirectResult();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const isPopupBlocked = () => {
    const testPopup = window.open('', '', 'width=1,height=1');
    if (!testPopup || testPopup.closed || typeof testPopup.closed === 'undefined') {
      return true;
    }
    testPopup.close();
    return false;
  };

  const signInWithGoogle = async () => {
    const { setLoading, setError } = useAuthStore.getState();
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting Google sign-in process...');
      const shouldUseRedirect = BROWSER_DETECTION.isMobile() || 
                              BROWSER_DETECTION.isSafari() || 
                              isPopupBlocked();

      if (shouldUseRedirect) {
        console.log('Using redirect flow');
        sessionStorage.setItem('googleSignInRedirect', 'true');
        await signInWithRedirect(auth, googleProvider);
        return false;
      }

      console.log('Using popup flow');
      console.log('Browser details:', {
        userAgent: navigator.userAgent,
        vendor: navigator.vendor,
        platform: navigator.platform,
        language: navigator.language,
        dimensions: {
          inner: { width: window.innerWidth, height: window.innerHeight },
          outer: { width: window.outerWidth, height: window.outerHeight },
        }
      });

      const result = await signInWithPopup(auth, googleProvider);
      
      if (result.user) {
        console.log('Google sign-in successful:', result.user.email);
        toast.success('Successfully signed in with Google!');
        return true;
      }
      
      setError('Sign-in failed: No user returned');
      return false;
    } catch (error: any) {
      console.log('Google sign-in error:', error.code);
      if (error.code === AUTH_ERROR_CODES.POPUP_BLOCKED || 
          error.code === AUTH_ERROR_CODES.POPUP_CLOSED_BY_USER) {
        console.log('Popup failed, falling back to redirect');
        sessionStorage.setItem('googleSignInRedirect', 'true');
        await signInWithRedirect(auth, googleProvider);
        return false;
      }
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
