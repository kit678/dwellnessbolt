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
  // Client-side (Vite)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }

  // Server-side (Node.js)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }

  console.warn(`Environment variable ${key} is not defined.`);
  return undefined;
}

// Firebase configuration keys mapping
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
