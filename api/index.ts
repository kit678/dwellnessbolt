import express from 'express';
import cors from 'cors';
import stripeRoutes from './stripe';
import webhookRoutes from './webhook';
import { sendBookingConfirmation, sendBookingReminder } from '../src/lib/email';
import { db } from '../src/lib/firebase';
import { collection, doc, updateDoc, getDoc, where, query, getDocs } from 'firebase/firestore';

const app = express();

app.use(cors());
app.use(express.json());


// Routes
app.use('/api/stripe', stripeRoutes);
app.use('/api/webhook', webhookRoutes);

// Schedule reminders for upcoming sessions
const scheduleReminders = async () => {
  const now = new Date();
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  try {
    const bookingsRef = collection(db, 'bookings');
    const q = query(
      bookingsRef,
      where('status', '==', 'confirmed'),
      where('session.startTime', '>=', now),
      where('session.startTime', '<=', twentyFourHoursFromNow)
    );
    const bookingsSnapshot = await getDocs(q);

    for (const bookingDoc of bookingsSnapshot.docs) {
      const booking = doc.data();
      const userDoc = await getDoc(doc(collection(db, 'users'), booking.userId));
      const userEmail = userDoc.data()?.email;

      if (userEmail) {
        await sendBookingReminder(userEmail, booking);
      }
    }
  } catch (error) {
    console.error('Error scheduling reminders:', error);
  }
};

// Run reminder scheduler every hour
setInterval(scheduleReminders, 60 * 60 * 1000);

export default app;
