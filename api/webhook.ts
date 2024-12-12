import express from 'express';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { logger } from '../src/utils/logger';
import { db } from '../src/lib/firebase.js';
import { sendBookingConfirmation } from '../src/lib/email.js';
import { collection, doc, updateDoc, getDoc } from 'firebase/firestore';

const router = express.Router();
const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

// Stripe requires the raw body to construct the event
export const config = {
  api: {
    bodyParser: false,
  },
};

router.post('/', async (req, res) => {
  logger.info('Webhook triggered', 'Webhook');
  const sig = req.headers['stripe-signature'];

  let event: Stripe.Event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    logger.error('Webhook signature verification failed.', err, 'Webhook');
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      logger.info('Processing checkout.session.completed event', 'Webhook');
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata as { [key: string]: string };
      const { bookingId, userId, sessionTitle, sessionDate, sessionPrice } = metadata;

      if (!bookingId || !userId) {
        console.error('Missing bookingId or userId in session metadata');
        return res.status(400).send('Missing bookingId or userId in session metadata');
      }

      try {
        logger.info(`Updating booking status to confirmed for bookingId: ${bookingId}`, 'Webhook');
        const bookingRef = doc(collection(db, 'bookings'), bookingId);
        const bookingDoc = await getDoc(bookingRef);
        if (bookingDoc.exists()) {
          logger.info(`Booking ${bookingId} found. Updating status to confirmed.`, 'Webhook');
          await updateDoc(bookingRef, {
            status: 'confirmed',
            paidAt: new Date().toISOString(),
          });
          logger.info(`Booking ${bookingId} confirmed.`, 'Webhook');
        } else {
          logger.error(`Booking ${bookingId} not found.`, 'Webhook');
          // Handle pending status if booking not found
          await updateDoc(bookingRef, {
            status: 'pending',
          });
        }

        // Fetch user email from Firestore
        const userDoc = await getDoc(doc(collection(db, 'users'), userId));
        const userData = userDoc.data();
        if (userData && userData.email) {
          logger.info(`Sending booking confirmation email to ${userData.email}`, 'Webhook');
          await sendBookingConfirmation(userData.email, {
            session: {
              title: sessionTitle,
              startTime: sessionDate,
              endTime: sessionDate,
              price: sessionPrice,
            },
          });
          logger.info(`Confirmation email sent to ${userData.email}`, 'Webhook');
        } else {
          console.error('User data or email not found for booking confirmation email.');
        }
      } catch (error) {
        logger.error('Error updating booking or sending confirmation email:', error, 'Webhook');
      }
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
