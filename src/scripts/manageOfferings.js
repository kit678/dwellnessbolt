import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Read service account credentials from config directory
const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, '../../config/serviceAccount.json'), 'utf8')
);

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

// Rest of your script remains the same...