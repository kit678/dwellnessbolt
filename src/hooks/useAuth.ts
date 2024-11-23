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
  GoogleAuthProvider
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
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
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
      // Configure persistence to keep user signed in
      await setPersistence(auth, browserSessionPersistence);
      console.log('Starting Google sign-in process...');

      // Using minimal scopes configured in firebase.ts
      // No additional scopes needed here

      let result;
      // Detect mobile devices for redirect vs popup
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        console.log('Mobile device detected, using redirect flow...');
        try {
          // Clear any pending redirect operations
          await getRedirectResult(auth);
          // Start new redirect flow
          await signInWithRedirect(auth, googleProvider);
          // Note: result will be null here since redirect happens
          return false; // Return false to indicate redirect started
        } catch (redirectError: any) {
          console.error('Redirect error:', redirectError);
          if (redirectError.code === 'auth/redirect-cancelled-by-user') {
            toast.error('Sign-in cancelled');
            return false;
          }
          throw redirectError;
        }
      } else {
        console.log('Desktop device detected, using popup flow...');
        try {
          result = await signInWithPopup(auth, googleProvider);
        } catch (popupError: any) {
          console.error('Popup error:', popupError);
          if (popupError.code === 'auth/popup-blocked') {
            console.log('Popup blocked, falling back to redirect...');
            toast.loading('Redirecting to Google Sign-in...');
            await signInWithRedirect(auth, googleProvider);
            return false;
          }
          throw popupError;
        }
      }

      if (result?.user) {
        // Get additional user info and OAuth credentials
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        
        // Log successful sign-in details
        console.log('Google sign-in successful:', {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          uid: result.user.uid,
          emailVerified: result.user.emailVerified,
          providerId: result.user.providerId,
          metadata: {
            creationTime: result.user.metadata.creationTime,
            lastSignInTime: result.user.metadata.lastSignInTime
          }
        });

        // Create/update user document
        await createUserDocument(result.user);
        
        // Show success message
        toast.success('Successfully signed in with Google!');
        return true;
      }
      
      console.log('No user data received from Google sign-in');
      return false;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      // Handle specific error cases
      switch (error.code) {
        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request':
          console.log('Sign-in cancelled by user');
          toast.error('Sign-in cancelled');
          return false;

        case 'auth/account-exists-with-different-credential':
          console.error('Account linking required:', error);
          // Get existing providers for the email
          const email = error.customData?.email;
          if (email) {
            const providers = await fetchSignInMethodsForEmail(auth, email);
            toast.error(`Please sign in with ${providers[0]}`);
          } else {
            toast.error('An account already exists with the same email. Please sign in with your original provider.');
          }
          break;

        case 'auth/network-request-failed':
          toast.error('Network error - please check your connection and try again');
          break;

        case 'auth/operation-not-allowed':
          console.error('Google sign-in not enabled in Firebase Console');
          toast.error('This sign-in method is not currently available');
          break;

        case 'auth/invalid-credential':
          console.error('Invalid Google credential:', error);
          toast.error('Unable to sign in - invalid credentials');
          break;

        case 'auth/user-disabled':
          toast.error('This account has been disabled. Please contact support.');
          break;

        case 'auth/timeout':
          toast.error('The sign in request timed out. Please try again.');
          break;

        default:
          handleAuthError(error);
      }
      throw error;
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
