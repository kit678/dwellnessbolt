import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase only if no apps are already initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
console.log('Firebase initialized with config:', {
  ...firebaseConfig,
  apiKey: '[REDACTED]' // Don't log API key
});

// Initialize Firestore with optimized settings
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
console.log('Firestore initialized with persistent local cache');

// Initialize Auth
const auth = getAuth(app);

// Set auth persistence to browserSessionPersistence
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log('Firebase Auth persistence set to browserSessionPersistence');
  })
  .catch((error) => {
    console.error('Error setting auth persistence:', error);
  });

// Configure Google Provider with explicit scopes
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { auth, db, googleProvider };
