import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);
const auth = getAuth(app);

async function checkSessionsCount() {
  try {
    console.log('Authenticating...');
    await signInAnonymously(auth);
    console.log('Authentication successful');

    console.log('Connecting to database...');
    
    // Get sessions collection reference
    const sessionsRef = collection(db, 'sessions');
    
    // Get all documents
    const snapshot = await getDocs(sessionsRef);
    
    console.log(`Total sessions in database: ${snapshot.size}`);
    
    // List all session titles
    if (snapshot.size > 0) {
      console.log('\nAvailable sessions:');
      snapshot.forEach(doc => {
        const session = doc.data();
        console.log(`- ${session.title} (${session.type})`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      name: error.name
    });
    process.exit(1);
  }
}

// Add error handler for unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

checkSessionsCount();