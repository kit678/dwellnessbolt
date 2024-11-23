import { useState, useEffect } from 'react';
import { 
  signInWithPopup,
  signInWithRedirect,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  getRedirectResult
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { User } from '../types/index';
import { auth, db, googleProvider } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { AUTH_ERROR_CODES, BROWSER_DETECTION } from '../constants/auth';
import toast from 'react-hot-toast';

function handleAuthError(error: any) {
  console.error('Auth error:', error);
  const { setError } = useAuthStore.getState();
  
  switch (error.code) {
    case AUTH_ERROR_CODES.POPUP_BLOCKED:
      toast.error('Popup was blocked. Please allow popups or try using redirect.');
      setError('Popup was blocked. Please allow popups or try using redirect.');
      break;
    case AUTH_ERROR_CODES.POPUP_CLOSED_BY_USER:
      console.log('User closed the popup');
      break;
    case AUTH_ERROR_CODES.ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL:
      toast.error('An account already exists with this email using a different sign-in method.');
      setError('An account already exists with this email using a different sign-in method.');
      break;
    case AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED:
      toast.error('Network error. Please check your connection and try again.');
      setError('Network error. Please check your connection and try again.');
      break;
    case AUTH_ERROR_CODES.TOO_MANY_REQUESTS:
      toast.error('Too many requests. Please try again later.');
      setError('Too many requests. Please try again later.');
      break;
    case AUTH_ERROR_CODES.USER_DISABLED:
      toast.error('This account has been disabled.');
      setError('This account has been disabled.');
      break;
    case AUTH_ERROR_CODES.USER_NOT_FOUND:
      toast.error('No account found with this email.');
      setError('No account found with this email.');
      break;
    case AUTH_ERROR_CODES.WRONG_PASSWORD:
      toast.error('Incorrect password.');
      setError('Incorrect password.');
      break;
    case AUTH_ERROR_CODES.INVALID_EMAIL:
      toast.error('Invalid email address.');
      setError('Invalid email address.');
      break;
    default:
      toast.error('Authentication failed. Please try again.');
      setError('Authentication failed. Please try again.');
      console.error('Unhandled auth error:', error);
  }
}

export function useAuth(): { 
  login: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: (navigate: (path: string) => void) => Promise<{ success: boolean; isRedirect: boolean }>;
  logout: () => Promise<void>;
  loading: boolean;
  user: User | null;
  updateUserProfile: (uid: string, data: Partial<User>) => Promise<void>;
} {
  const [loading, setLoading] = useState(false);
  const { setUser, logout: storeLogout } = useAuthStore();

  useEffect(() => {
    let isMounted = true;
    const { setLoading, setError } = useAuthStore.getState();

    // Handle redirect result
    const handleRedirectResult = async () => {
      const redirectPending = sessionStorage.getItem('googleSignInRedirect');
      console.log('Checking redirect result. Pending:', redirectPending);
      
      if (redirectPending) {
        try {
          console.log('Processing redirect result...');
          setLoading(true);
          const result = await getRedirectResult(auth);
          
          if (result?.user) {
            console.log('Redirect sign-in successful:', result.user.email);
            toast.success('Successfully signed in with Google!');
            // Force a state update
            setUser({
              id: result.user.uid,
              uid: result.user.uid,
              email: result.user.email || '',
              name: result.user.displayName || '',
              displayName: result.user.displayName || '',
              role: 'user',
              quizCompleted: false,
              dosha: null,
              secondaryDosha: null,
              quizResults: [],
              lastQuizDate: null
            });
          } else {
            console.log('No redirect result found');
          }
        } catch (error: any) {
          console.error('Redirect sign-in error:', error);
          handleAuthError(error);
        } finally {
          console.log('Cleaning up redirect state');
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
              dosha: userData.dosha || null,
              secondaryDosha: userData.secondaryDosha || null,
              quizResults: Array.isArray(userData.quizResults) ? userData.quizResults.map(result => ({
                ...result,
                percentages: result.percentages || { Vata: 0, Pitta: 0, Kapha: 0 },
                scores: result.scores || { Vata: 0, Pitta: 0, Kapha: 0 }
              })) : [],
              lastQuizDate: userData.lastQuizDate || null
            };
            if (isMounted) {
              setUser(user);
              // Check if we're on the login page and redirect if needed
              const currentPath = window.location.pathname;
              if (currentPath === '/login') {
                window.location.href = '/dashboard';
              }
            }
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


  const signInWithGoogle = async (navigate: (path: string) => void): Promise<{ success: boolean; isRedirect: boolean }> => {
    const { setLoading, setError, setUser } = useAuthStore.getState();
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting Google sign-in process...');
      const useRedirect = BROWSER_DETECTION.shouldUseRedirect();
      console.log('Using redirect method?', useRedirect);

      if (useRedirect) {
        console.log('Initiating redirect flow');
        sessionStorage.setItem('googleSignInRedirect', 'true');
        await signInWithRedirect(auth, googleProvider);
        return { success: false, isRedirect: true }; // Redirect in progress
      }

      console.log('Initiating popup flow');
      const result = await signInWithPopup(auth, googleProvider);
      
      if (result.user) {
        console.log('Google sign-in successful:', result.user.email);
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const user = {
            id: userDoc.id,
            uid: result.user.uid,
            email: userData.email || result.user.email || '',
            name: userData.displayName || result.user.displayName || '',
            displayName: userData.displayName || result.user.displayName || '',
            role: userData.role || 'user',
            quizCompleted: userData.quizCompleted || false,
            dosha: userData.dosha || null,
            secondaryDosha: userData.secondaryDosha || null,
            quizResults: userData.quizResults || [],
            lastQuizDate: userData.lastQuizDate || null
          };
          setUser(user);
          toast.success('Successfully signed in with Google!');
          navigate('/dashboard');
          return { success: true, isRedirect: false };
        }
      }
      
      setError('Sign-in failed: No user returned');
      return { success: false, isRedirect: false };
    } catch (error: any) {
      console.log('Google sign-in error:', error.code);
      
      // Only fall back to redirect if popup was blocked
      if (error.code === AUTH_ERROR_CODES.POPUP_BLOCKED) {
        console.log('Popup blocked, falling back to redirect');
        sessionStorage.setItem('googleSignInRedirect', 'true');
        await signInWithRedirect(auth, googleProvider);
        return { success: false, isRedirect: true };
      }
      
      // Don't treat popup closure as an error
      if (error.code === AUTH_ERROR_CODES.POPUP_CLOSED_BY_USER) {
        console.log('User closed the popup');
        return { success: false, isRedirect: false };
      }
      
      handleAuthError(error);
      return { success: false, isRedirect: false };
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

  const updateUserProfile = async (uid: string, data: Partial<User>) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, data);
      const { setUser } = useAuthStore.getState();
      setUser({ ...useAuthStore.getState().user, ...data } as User);
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
