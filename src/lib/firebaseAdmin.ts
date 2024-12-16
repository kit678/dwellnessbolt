import admin from 'firebase-admin';

// Initialize the Firebase Admin SDK
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load the service account key JSON file
const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, '../../../config/serviceAccountKey.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

export { admin, db };
