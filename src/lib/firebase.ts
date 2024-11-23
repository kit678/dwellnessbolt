import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Use Vite's environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Enable Firebase internal debugging
if (import.meta.env.DEV) {
  const debugConfig = {
    trace: true,
    debug: true,
  };
  // @ts-ignore - Firebase internal debug config
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  // @ts-ignore - Firebase internal debug config
  self.FIREBASE_DEBUG_MODE = debugConfig;
}

// Initialize Firebase only if no apps are already initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
console.log('Firebase initialized with config:', {
  ...firebaseConfig,
  apiKey: '[REDACTED]' // Don't log API key
});

// Initialize Firebase Authentication with custom settings
const auth = getAuth(app);
auth.settings.appVerificationDisabledForTesting = false;

// Configure auth to allow iframe operations
auth.settings.forceRecaptchaFlowForTesting = false;

// Initialize Firestore
const db = getFirestore(app);

// Configure Google Auth Provider with more permissive settings
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
  access_type: 'online'
});

// Set default persistence
setPersistence(auth, browserSessionPersistence)
  .catch(error => console.error('Failed to set auth persistence:', error));

export { auth, db, googleProvider };
