import admin from 'firebase-admin';

// Initialize the Firebase Admin SDK
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load the service account key JSON file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, '../../../config/serviceAccountKey.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

export { admin, db };
