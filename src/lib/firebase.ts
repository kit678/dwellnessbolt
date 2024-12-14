// src/lib/firebase.ts

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

// Function to get environment variables
function getEnvVariable(key: string): string | undefined {
  // Use process.env for server-side environment variables
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }

  console.warn(`Environment variable ${key} is not defined.`);
  return undefined;
}

console.log('Environment Variables:');
console.log('VITE_FIREBASE_API_KEY:', process.env.VITE_FIREBASE_API_KEY);
console.log('VITE_FIREBASE_AUTH_DOMAIN:', process.env.VITE_FIREBASE_AUTH_DOMAIN);
console.log('VITE_FIREBASE_PROJECT_ID:', process.env.VITE_FIREBASE_PROJECT_ID);
console.log('VITE_FIREBASE_STORAGE_BUCKET:', process.env.VITE_FIREBASE_STORAGE_BUCKET);
console.log('VITE_FIREBASE_MESSAGING_SENDER_ID:', process.env.VITE_FIREBASE_MESSAGING_SENDER_ID);
console.log('VITE_FIREBASE_APP_ID:', process.env.VITE_FIREBASE_APP_ID);

const firebaseConfig = {
  apiKey: getEnvVariable('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVariable('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVariable('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVariable('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVariable('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVariable('VITE_FIREBASE_APP_ID'),
};

// Initialize Firebase app
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
console.log('Firebase initialized with config:', firebaseConfig);

// Initialize Firestore
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
console.log('Firestore initialized with persistent local cache');

// Initialize Auth
const auth = getAuth(app);

// Set auth persistence (only in browser)
if (typeof window !== 'undefined') {
  setPersistence(auth, browserSessionPersistence)
    .then(() => {
      console.log('Firebase Auth persistence set to browserSessionPersistence');
    })
    .catch((error) => {
      console.error('Error setting auth persistence:', error);
    });
}

// Configure Google Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

export { auth, db, googleProvider };
