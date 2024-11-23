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
// Note: Removed CORP meta tag as it was interfering with Firebase Auth iframe
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
console.log('Firebase initialized with config:', {
  ...firebaseConfig,
  apiKey: '[REDACTED]' // Don't log API key
});

// Configure additional security settings for auth
const authSettings = getAuth(app).settings;
authSettings.appVerificationDisabledForTesting = false; // Ensure verification is enabled

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Configure Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
  access_type: 'online',
  display: 'popup'  // Force popup display
});

// Set default persistence
setPersistence(auth, browserSessionPersistence)
  .catch(error => console.error('Failed to set auth persistence:', error));

export { auth, db, googleProvider };
