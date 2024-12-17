import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { logger } from '../../src/utils/logger.js';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(
  readFileSync(resolve('D:/Dev/WellnessBolt/config/dwellness-93630-firebase-adminsdk-44foe-e02410b4b9.json'), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function updateSessionsCollection() {
  logger.info('Starting update of sessions collection', 'UpdateSessions');
  const sessionsSnapshot = await db.collection('sessions').get();
  logger.info(`Fetched ${sessionsSnapshot.size} sessions from Firestore`, 'UpdateSessions');

  sessionsSnapshot.forEach(async (doc) => {
    logger.info(`Processing session ${doc.id}`, 'UpdateSessions');
    const sessionData = doc.data();
    if (!sessionData) {
      logger.warn(`No data found for session ${doc.id}`, 'UpdateSessions');
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
      logger.info(`Updated session ${doc.id} with new bookings structure.`, 'UpdateSessions');
    } catch (error) {
      logger.error(`Failed to update session ${doc.id}: ${error.message}`, error, 'UpdateSessions');
    }
    console.log(`Updated session ${doc.id} with new bookings structure.`);
  });
}

updateSessionsCollection()
  .then(() => {
    logger.info('Sessions collection update complete.', 'UpdateSessions');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Error updating sessions collection:', error, 'UpdateSessions');
    process.exit(1);
  });
