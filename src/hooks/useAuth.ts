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
import { userService } from '../services/userService';
import type { User } from '../types';
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

export function useAuth() {
  return {
    login,
    signInWithGoogle,
    logout,
    loading,
    user: useAuthStore.getState().user
  };
}
