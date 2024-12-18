import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const serviceAccount = JSON.parse(
  readFileSync(resolve('D:/Dev/WellnessBolt/config/dwellness-93630-firebase-adminsdk-44foe-e02410b4b9.json'), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

function computeAvailableDates(recurringDays) {
  const dates = [];
  if (recurringDays.length === 0) return dates;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let currentDate = new Date(today);

  while (dates.length < 4) {
    currentDate.setDate(currentDate.getDate() + 1);
    const dayOfWeek = currentDate.getDay();

    if (recurringDays.includes(dayOfWeek)) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dates.push(dateStr);
    }
  }
  return dates;
}

function processDateKeysSequentially(dateKeys, index, bookings, sessionData, sessionId, callback) {
  if (index >= dateKeys.length) {
    // No more dates to process
    return callback();
  }

  const dateKey = dateKeys[index];
  bookings[dateKey] = { confirmedBookings: [], remainingCapacity: sessionData.capacity };
  console.log(`Querying bookings for session ${sessionId} on date ${dateKey}`);

  const bookingsQuery = db.collection('bookings')
    .where('sessionId', '==', sessionId)
    .where('scheduledDate', '==', dateKey)
    .where('status', '==', 'confirmed');

  bookingsQuery.get()
    .then(bookingsSnapshot => {
      console.log(`Fetched ${bookingsSnapshot.size} bookings for session ${sessionId} on date ${dateKey}`);
      const confirmedBookings = bookingsSnapshot.docs.map(bookingDoc => {
        const bookingData = bookingDoc.data();
        console.log(`Booking data for session ${sessionId} on date ${dateKey}:`, bookingData);
        return {
          userId: bookingData.userId,
          bookingId: bookingDoc.id,
        };
      });

      bookings[dateKey] = {
        confirmedBookings,
        remainingCapacity: sessionData.capacity - confirmedBookings.length,
      };

      console.log(`Updated bookings for session ${sessionId} on date ${dateKey}:`, bookings[dateKey]);

      // Move on to the next date
      processDateKeysSequentially(dateKeys, index + 1, bookings, sessionData, sessionId, callback);
    })
    .catch(error => {
      console.error(`Error querying bookings for session ${sessionId} on date ${dateKey}:`, error);
      // Even if there's an error, continue to the next date
      processDateKeysSequentially(dateKeys, index + 1, bookings, sessionData, sessionId, callback);
    });
}

function updateSessionsCollection() {
  console.log('Starting update of sessions collection');
  db.collection('sessions').get()
    .then(sessionsSnapshot => {
      console.log(`Fetched ${sessionsSnapshot.size} sessions from Firestore`);

      // We'll process sessions one by one using a similar pattern
      function processSessionsSequentially(docs, idx) {
        if (idx >= docs.length) {
          console.log('Sessions collection update complete.');
          process.exit(0);
          return;
        }

        const doc = docs[idx];
        const sessionData = doc.data();
        if (!sessionData) {
          console.warn(`No data found for session ${doc.id}`);
          return processSessionsSequentially(docs, idx + 1);
        }

        console.log(`Processing session ${doc.id} with data:`, sessionData);
        if (sessionData.title === "test consultation") {
          console.log(`Test session ${doc.id} is being processed.`);
        }
        const bookings = sessionData.bookings || {};
        const availableDates = computeAvailableDates(sessionData.recurringDays || []);
        console.log(`Available dates for session ${doc.id}:`, availableDates);

        processDateKeysSequentially(availableDates, 0, bookings, sessionData, doc.id, () => {
          console.log(`Final bookings object for session ${doc.id}:`, JSON.stringify(bookings, null, 2));
          console.log(`Bookings object for session ${doc.id}:`, bookings);
          console.log(`Finished processing session ${doc.id}.`);

          db.collection('sessions').doc(doc.id).update({ bookings })
            .then(() => {
              console.log(`Successfully updated session ${doc.id} with new bookings structure.`);
              processSessionsSequentially(docs, idx + 1);
            })
            .catch(error => {
              console.error(`Failed to update session ${doc.id}:`, error);
              processSessionsSequentially(docs, idx + 1);
            });
        });
      }

      processSessionsSequentially(sessionsSnapshot.docs, 0);
    })
    .catch(error => {
      console.error('Error updating sessions collection:', error);
      process.exit(1);
    });
}

updateSessionsCollection();
