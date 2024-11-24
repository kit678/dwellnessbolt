import { useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';
import { 
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  AuthErrorCodes
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { userService } from '../services/userService';
import { User } from '../types/index';
import { FirebaseError } from 'firebase/app';

// Type Guard to check if error is FirebaseError
function isFirebaseError(error: unknown): error is FirebaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as any).code === 'string'
  );
}
import toast from 'react-hot-toast';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lastLoginAttempt, setLastLoginAttempt] = useState<Date | null>(null);
  const { setUser, logout: storeLogout } = useAuthStore();

  const handleAuthError = useCallback((error: any) => {
    let errorMessage = 'An unexpected error occurred';
    
    if (typeof error === 'object' && error !== null && 'code' in error) {
      switch (error.code) {
        case AuthErrorCodes.USER_DISABLED:
          errorMessage = 'This account has been disabled';
          break;
        case AuthErrorCodes.USER_DELETED:
          errorMessage = 'Account not found';
          break;
        case AuthErrorCodes.INVALID_EMAIL:
          errorMessage = 'Invalid email address';
          break;
        case AuthErrorCodes.INVALID_PASSWORD:
          errorMessage = 'Incorrect password';
          break;
        case AuthErrorCodes.EMAIL_EXISTS:
          errorMessage = 'Email already in use';
          break;
        case AuthErrorCodes.WEAK_PASSWORD:
          errorMessage = 'Password is too weak';
          break;
        case AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER:
          errorMessage = 'Too many attempts. Please try again later';
          break;
        case AuthErrorCodes.POPUP_CLOSED_BY_USER:
          // Don't show error for user-closed popups
          return;
        default:
          errorMessage = error.message || errorMessage;
      }
    }

    setError(errorMessage);
    toast.error(errorMessage);
    return errorMessage;
  }, []);

  const checkRateLimit = useCallback(() => {
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

    if (lastLoginAttempt && loginAttempts >= MAX_ATTEMPTS) {
      const timeSinceLastAttempt = Date.now() - lastLoginAttempt.getTime();
      if (timeSinceLastAttempt < LOCKOUT_DURATION) {
        const remainingTime = Math.ceil((LOCKOUT_DURATION - timeSinceLastAttempt) / 60000);
        throw new Error(`Too many login attempts. Please try again in ${remainingTime} minutes`);
      } else {
        // Reset attempts after lockout period
        setLoginAttempts(0);
        setLastLoginAttempt(null);
      }
    }
  }, [lastLoginAttempt, loginAttempts]);

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
              authProvider: firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              quizCompleted: false,
              dosha: null,
              secondaryDosha: null,
              quizResults: [],
              lastQuizDate: null,
              bookings: []
            };
            await userService.updateUserProfile(firebaseUser.uid, defaultUser);
            const updatedUser = await userService.getUserProfile(firebaseUser.uid);
            if (updatedUser) {
              setUser(updatedUser);
            }
            logger.info('User profile created successfully', 'useAuth');
          }
        } catch (error) {
          if (error instanceof Error) {
            logger.error('Failed to fetch user data', error, 'useAuth');
          } else {
            logger.error('Failed to fetch user data', new Error('Unknown error'), 'useAuth');
          }
        }
      } else {
        setUser(null);
      }
      logger.info('User state updated', 'useAuth');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      checkRateLimit();
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (!userCredential.user.emailVerified) {
        throw new Error('Please verify your email before logging in');
      }

      setLoginAttempts(0);
      setLastLoginAttempt(null);
      const userData = await userService.getUserProfile(userCredential.user.uid);
      if (userData) {
        setUser(userData);
      } else {
        // Create default user profile if it doesn't exist
        const defaultUser: User = {
          id: userCredential.user.uid,
          uid: userCredential.user.uid,
          email: userCredential.user.email || '',
          displayName: userCredential.user.displayName || '',
          name: userCredential.user.displayName || '',
          role: 'user',
          authProvider: userCredential.user.providerData[0]?.providerId === 'google.com' ? 'google' : 'email',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          quizCompleted: false,
          dosha: null,
          secondaryDosha: null,
          quizResults: [],
          lastQuizDate: null,
          bookings: []
        };
        await userService.updateUserProfile(userCredential.user.uid, defaultUser);
        setUser(defaultUser);
        logger.info('User profile created successfully', 'useAuth');
      }
      toast.success('Successfully signed in!');
    } catch (error) {
      setLoginAttempts(prev => prev + 1);
      setLastLoginAttempt(new Date());
      if (isFirebaseError(error) && error.code === 'auth/email-already-in-use') {
        handleAuthError(new Error('This email is already associated with an account. Please sign in with Google if you previously used Google Sign-in.'));
      } else {
        handleAuthError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(userCredential.user, { displayName });
      
      // Send verification email
      await sendEmailVerification(userCredential.user);
      
      toast.success('Account created! Please check your email for verification.');
      return userCredential.user;
    } catch (error) {
      handleAuthError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Configure password reset email settings
      const actionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true
      };
      
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      toast.success('Password reset email sent! Please check your inbox.');
      return true;
    } catch (error) {
      const errorMessage = handleAuthError(error);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('No user logged in');

      if (!user.emailVerified) {
        throw new Error('Please verify your email before changing password');
      }

      // Validate new password
      if (newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters long');
      }

      // Re-authenticate user before password change
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      try {
        await reauthenticateWithCredential(user, credential);
      } catch (error) {
        throw new Error('Current password is incorrect');
      }
      
      // Update password
      await updatePassword(user, newPassword);
      
      // Log the security event
      console.log('Password updated successfully for user:', user.email);
      
      toast.success('Password updated successfully');
      return true;
    } catch (error) {
      const errorMessage = handleAuthError(error);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');
      
      if (user.emailVerified) {
        throw new Error('Email is already verified');
      }

      // Configure verification email settings
      const actionCodeSettings = {
        url: `${window.location.origin}/dashboard`,
        handleCodeInApp: true
      };
      
      await sendEmailVerification(user, actionCodeSettings);
      
      // Store last sent timestamp to prevent spam
      localStorage.setItem('lastVerificationEmailSent', Date.now().toString());
      
      toast.success('Verification email sent! Please check your inbox.');
      return true;
    } catch (error) {
      const errorMessage = handleAuthError(error);
      throw new Error(errorMessage);
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
    signup,
    signInWithGoogle,
    logout,
    resetPassword,
    updateUserPassword,
    resendVerificationEmail,
    loading,
    error,
    user: useAuthStore.getState().user,
    updateUserProfile
  };
}
