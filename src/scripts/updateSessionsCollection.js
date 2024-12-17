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
    const sessionData = doc.data();
    console.log(`Processing session ${doc.id} with data:`, sessionData);
    if (!sessionData) {
      console.warn(`No data found for session ${doc.id}`);
      return;
    }
    const bookings = sessionData.bookings || {};

    // Initialize bookings for each recurring day
    const computeAvailableDates = (recurringDays) => {
      const dates = [];
      if (recurringDays.length === 0) return dates;

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set time to midnight
      let currentDate = new Date(today);

      while (dates.length < 4) {
        currentDate.setDate(currentDate.getDate() + 1);
        const dayOfWeek = currentDate.getDay();

        if (recurringDays.includes(dayOfWeek)) {
          // Format date as 'yyyy-MM-dd' to ensure consistency
          const dateStr = currentDate.toISOString().split('T')[0];
          dates.push(dateStr);
        }
      }

      return dates;
    };

    const availableDates = computeAvailableDates(sessionData.recurringDays || []);
    console.log(`Available dates for session ${doc.id}:`, availableDates);
    for (const dateKey of availableDates) {
      try {
        console.log(`Querying bookings for session ${doc.id} on date ${dateKey}`);
        const bookingsQuery = db.collection('bookings')
          .where('sessionId', '==', doc.id)
          .where('scheduledDate', '==', dateKey)
          .where('status', '==', 'confirmed');

        const bookingsSnapshot = await bookingsQuery.get();
        console.log(`Fetched ${bookingsSnapshot.size} bookings for session ${doc.id} on date ${dateKey}`);
        const confirmedBookings = bookingsSnapshot.docs.map(bookingDoc => ({
          userId: bookingDoc.data().userId,
          bookingId: bookingDoc.id,
        }));

        bookings[dateKey] = {
          confirmedBookings,
          remainingCapacity: sessionData.capacity - confirmedBookings.length,
        };

        console.log(`Updated bookings for session ${doc.id} on date ${dateKey}:`, bookings[dateKey]);
      } catch (error) {
        console.error(`Error querying bookings for session ${doc.id} on date ${dateKey}:`, error);
      }
    }

    // Commenting out the update to Firestore for now
    // console.log(`Bookings object for session ${doc.id} before update:`, JSON.stringify(bookings, null, 2));
    // try {
    //   await db.collection('sessions').doc(doc.id).update({ bookings });
    //   console.log(`Successfully updated session ${doc.id} with new bookings structure.`);
    // } catch (error) {
    //   console.error(`Failed to update session ${doc.id}:`, error);
    // }
    console.log(`Bookings object for session ${doc.id}:`, JSON.stringify(bookings, null, 2));
    console.log(`Finished processing session ${doc.id}.`);
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
