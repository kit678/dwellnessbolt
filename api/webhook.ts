import express from 'express';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { logger } from '../src/utils/logger.js';
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
  logger.info('Webhook triggered at /webhook', 'Webhook');
  res.status(200).send('Webhook received'); // Immediately send a response to avoid timeouts
  logger.debug(`Request headers: ${JSON.stringify(req.headers)}`, 'Webhook');
  const sig = req.headers['stripe-signature'];

  let event: Stripe.Event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig!, process.env.VITE_STRIPE_TEST_WEBHOOK_SECRET!);
    logger.debug(`Received event type: ${event.type} at /webhook`, 'Webhook');
    logger.debug(`Event data: ${JSON.stringify(event.data)}`, 'Webhook');
    logger.debug(`Event details: ${JSON.stringify(event.data)}`, 'Webhook');
    logger.debug(`Received headers at /webhook: ${JSON.stringify(req.headers)}`, 'Webhook');
  } catch (err: unknown) {
    logger.error('Error processing webhook event', err instanceof Error ? err : new Error('Unknown error'), 'Webhook');
    res.status(400).send(`Webhook Error: ${(err as Error)?.message || 'Unknown error'}`);
    if (err instanceof Error) {
      logger.error('Webhook signature verification failed.', err, 'Webhook');
      logger.debug(`Error details: ${err.message}`, 'Webhook');
    } else {
      logger.error('Webhook signature verification failed with unknown error.', new Error('Unknown verification error'), 'Webhook');
    }
    return res.status(400).send(`Webhook Error: ${(err as Error)?.message || 'Unknown error'}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      logger.info('Processing checkout.session.completed event', 'Webhook');
      const session = event.data.object as Stripe.Checkout.Session;
      logger.debug(`Session object after casting: ${JSON.stringify(session)}`, 'Webhook');
      const metadata = session.metadata as { [key: string]: string };
      logger.debug(`Session metadata: ${JSON.stringify(metadata)}`, 'Webhook');
      logger.debug(`Session object: ${JSON.stringify(session)}`, 'Webhook');
      const { bookingId, userId, sessionTitle, sessionDate, sessionPrice } = metadata;
      logger.debug(`Extracted metadata: bookingId=${bookingId}, userId=${userId}`, 'Webhook');

      if (!bookingId || !userId) {
        logger.error('Missing bookingId or userId in session metadata', new Error('Missing bookingId or userId'), 'Webhook');
        return res.status(400).send('Missing bookingId or userId in session metadata');
      }

      try {
        logger.info(`Attempting to update booking status to confirmed for bookingId: ${bookingId}`, 'Webhook');
        const bookingRef = doc(collection(db, 'bookings'), bookingId);
        logger.debug(`Booking reference: ${bookingRef.path}`, 'Webhook');
        const bookingDoc = await getDoc(bookingRef);
        logger.debug(`Booking document: ${JSON.stringify(bookingDoc.data())}`, 'Webhook');
        if (bookingDoc.exists()) {
          logger.info(`Booking ${bookingId} found. Proceeding to update status to confirmed.`, 'Webhook');
          await updateDoc(bookingRef, {
            status: 'confirmed',
            paidAt: new Date().toISOString(),
          });
          logger.info(`Booking ${bookingId} successfully updated to confirmed.`, 'Webhook');
        } else {
          logger.error(`Booking ${bookingId} not found in Firestore.`, new Error(`Booking ${bookingId} not found`), 'Webhook');
          // Handle pending status if booking not found
          await updateDoc(bookingRef, {
            status: 'pending',
          });
          logger.info(`Booking ${bookingId} status set to pending due to non-existence.`, 'Webhook');
        }

        // Fetch user email from Firestore
        logger.info(`Fetching user data for userId: ${userId}`, 'Webhook');
        const userDoc = await getDoc(doc(collection(db, 'users'), userId));
        logger.debug(`User document: ${JSON.stringify(userDoc.data())}`, 'Webhook');
        const userData = userDoc.data();
        if (userData && userData.email) {
          logger.info(`User data found. Sending booking confirmation email to ${userData.email}`, 'Webhook');
          await sendBookingConfirmation(userData.email, {
            session: {
              title: sessionTitle,
              startTime: sessionDate,
              endTime: sessionDate,
              price: sessionPrice,
            },
          });
          logger.info(`Booking confirmation email successfully sent to ${userData.email}`, 'Webhook');
        } else {
          logger.error('User data or email not found for booking confirmation email.', new Error('No user email found'), 'Webhook');
        }
        res.json({ received: true });
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error('Error occurred while updating booking or sending confirmation email:', error, 'Webhook');
          logger.debug(`Error details: ${error.message}`, 'Webhook');
        } else {
          logger.error('Unknown error occurred while updating booking or sending confirmation email.', new Error('Unknown booking update error'), 'Webhook');
        }
        // Even if there's an error, we can still send a response. Adjust as needed.
        res.status(500).json({ error: 'Internal Server Error' });
      }
      res.json({ received: true });
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
      res.json({ received: true });
  }
});

export default router;
