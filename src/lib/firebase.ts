// src/lib/firebase.ts

import { initializeApp, getApps } from 'firebase/app';

import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase app
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
console.log('Firebase initialized with config:', firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);
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

/*
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    if (user) {
      console.log(`Google user photoURL: ${user.photoURL}`);
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        profile_pic: user.photoURL || userData?.profile_pic, // Ensure profile_pic is set from user.photoURL
        authProvider: 'google',
        createdAt: userData?.createdAt || new Date().toISOString(), // Preserve existing createdAt
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error signing in with Google:', error);
  }
};
*/

// Configure Google Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

export { auth, db, googleProvider };
