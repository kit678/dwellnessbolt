import admin from 'firebase-admin';

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

export { admin, db };
