import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(
  readFileSync(resolve('D:/Dev/WellnessBolt/config/dwellness-93630-firebase-adminsdk-44foe-e02410b4b9.json'), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function updateSessionsCollection() {
  console.log('Starting update of sessions collection');
  const sessionsSnapshot = await db.collection('sessions').get();
  console.log(`Fetched ${sessionsSnapshot.size} sessions from Firestore`);

  sessionsSnapshot.forEach(async (doc) => {
    console.log(`Processing session ${doc.id}`);
    const sessionData = doc.data();
    if (!sessionData) {
      console.warn(`No data found for session ${doc.id}`);
      return;
    }
    const bookings = sessionData.bookings || {};

    // Initialize bookings for each recurring day
    (sessionData.recurringDays || []).forEach((day) => {
      const dateKey = new Date().toISOString().split('T')[0]; // Example date key
      if (!bookings[dateKey]) {
        bookings[dateKey] = {
          confirmedBookings: [],
          remainingCapacity: sessionData.capacity,
        };
      }
    });

    // Update the session document with the new bookings structure
    try {
      await db.collection('sessions').doc(doc.id).update({ bookings });
      console.log(`Updated session ${doc.id} with new bookings structure.`);
    } catch (error) {
      console.error(`Failed to update session ${doc.id}: ${error.message}`, error);
    }
    console.log(`Updated session ${doc.id} with new bookings structure.`);
  });
}

updateSessionsCollection()
  .then(() => {
    console.log('Sessions collection update complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error updating sessions collection:', error);
    process.exit(1);
  });
