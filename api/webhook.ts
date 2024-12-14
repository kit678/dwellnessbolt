import express from 'express';
import Stripe from 'stripe';
import { logger } from '../src/utils/logger.js';
import { db } from '../src/lib/firebase.js';
import { sendBookingConfirmation } from '../src/lib/email.js';
import { collection, doc, updateDoc, getDoc } from 'firebase/firestore';

const router = express.Router();

const isDevelopment = process.env.VITE_NODE_ENV === 'development';

const stripeSecretKey = isDevelopment
  ? process.env.VITE_STRIPE_TEST_SECRET_KEY!
  : process.env.VITE_STRIPE_SECRET_KEY!;

const endpointSecret = isDevelopment
  ? process.env.VITE_STRIPE_TEST_WEBHOOK_SECRET!
  : process.env.VITE_STRIPE_WEBHOOK_SECRET!;

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

// Define the POST route for the webhook with the raw body parser applied inline.
// This ensures that this specific route receives the raw, unparsed request body.
router.post(
  '/',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    logger.info('Webhook triggered at /webhook', 'Webhook');
    logger.debug(`Request headers: ${JSON.stringify(req.headers)}`, 'Webhook');

    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;

    try {
      // req.body will be a Buffer because of express.raw()
      event = stripe.webhooks.constructEvent(req.body, sig!, endpointSecret);
      logger.debug(`Received event type: ${event.type} at /webhook`, 'Webhook');
    } catch (err: unknown) {
      logger.error(
        'Error processing webhook event',
        err instanceof Error ? err : new Error('Unknown error'),
        'Webhook'
      );
      if (err instanceof Error) {
        logger.error('Webhook signature verification failed.', err, 'Webhook');
        logger.debug(`Error details: ${err.message}`, 'Webhook');
      }
      return res
        .status(400)
        .send(
          `Webhook Error: ${(err as Error)?.message || 'Unknown error'}`
        );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        logger.info('Processing checkout.session.completed event', 'Webhook');
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata as { [key: string]: string };
        logger.debug(`Session metadata: ${JSON.stringify(metadata)}`, 'Webhook');

        const { bookingId, userId, sessionTitle, sessionDate, sessionPrice } =
          metadata;

        if (!bookingId || !userId) {
          logger.error(
            'Missing bookingId or userId in session metadata',
            new Error('Missing bookingId or userId'),
            'Webhook'
          );
          return res
            .status(400)
            .send('Missing bookingId or userId in session metadata');
        }

        try {
          logger.info(
            `Updating booking status to confirmed for bookingId: ${bookingId}`,
            'Webhook'
          );
          const bookingRef = doc(collection(db, 'bookings'), bookingId);

          // Fetch the booking document to ensure it exists
          const bookingDoc = await getDoc(bookingRef);
          if (bookingDoc.exists()) {
            try {
              // Update the booking status to confirmed
              await updateDoc(bookingRef, {
                status: 'confirmed',
                paidAt: new Date().toISOString(),
              });
              logger.info(
                `Booking ${bookingId} successfully updated to confirmed.`,
                'Webhook'
              );
            } catch (updateError) {
              logger.error(
                'Error updating booking status to confirmed.',
                updateError,
                'Webhook'
              );
            }
          } else {
            logger.error(
              `Booking ${bookingId} not found in Firestore.`,
              new Error(`Booking ${bookingId} not found`),
              'Webhook'
            );
          }

          // Fetch user email
          const userDoc = await getDoc(doc(collection(db, 'users'), userId));
          const userData = userDoc.data();
          if (userData && userData.email) {
            logger.info(
              `Sending booking confirmation email to ${userData.email}`,
              'Webhook'
            );
            await sendBookingConfirmation(userData.email, {
              session: {
                title: sessionTitle,
                startTime: sessionDate,
                endTime: sessionDate,
                price: sessionPrice,
              },
            });
            logger.info(
              `Booking confirmation email successfully sent to ${userData.email}`,
              'Webhook'
            );
          } else {
            logger.error(
              'User data or email not found for booking confirmation email.',
              new Error('No user email found'),
              'Webhook'
            );
          }

          return res.json({ received: true });
        } catch (error: unknown) {
          if (error instanceof Error) {
            logger.error('Error updating booking or sending email:', error, 'Webhook');
            logger.debug(`Error details: ${error.message}`, 'Webhook');
          } else {
            logger.error('Unknown error occurred while updating booking or sending email.', new Error('Unknown error'), 'Webhook');
          }
          return res.status(500).json({ error: 'Internal Server Error' });
        }

      default:
        logger.info(`Unhandled event type ${event.type}`, 'Webhook');
        return res.json({ received: true });
    }
  }
);

export default router;
