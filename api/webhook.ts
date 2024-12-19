import express from 'express';
import Stripe from 'stripe';
import { logger } from '../src/utils/logger.js';
import { db } from '../src/lib/firebaseAdmin.js';
import { getAuth } from 'firebase/auth';
import { sendBookingConfirmation, sendBookingReminder } from '../src/lib/email.js';

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
router.post(
  '/',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    logger.info('Webhook triggered at /webhook', 'Webhook');
    logger.debug(`Request headers: ${JSON.stringify(req.headers)}`, 'Webhook');

    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;

    try {
      // req.body is a Buffer due to express.raw()
      event = stripe.webhooks.constructEvent(req.body, sig!, endpointSecret);
      logger.debug(`Received event type: ${event.type} at /webhook`, 'Webhook');
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error('Unknown error');
      logger.error('Error processing webhook event', errorObj, 'Webhook');
      if (err instanceof Error) {
        logger.error('Webhook signature verification failed.', err, 'Webhook');
        logger.debug(`Error details: ${err.message}`, 'Webhook');
      }
      return res
        .status(400)
        .send(`Webhook Error: ${errorObj.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        logger.info('Processing checkout.session.completed event', 'Webhook');
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata as { [key: string]: string };
        logger.debug(`Session metadata: ${JSON.stringify(metadata)}`, 'Webhook');

        const { bookingId, userId } = metadata;
        const sessionTitle = session.metadata?.sessionTitle || 'Session';
        const sessionDate = session.metadata?.sessionDate || new Date().toISOString();
        const sessionPrice = session.metadata?.sessionPrice || '0';

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
          // Use the user's credentials to update the booking
          const bookingRef = db.collection('bookings').doc(bookingId);

          // Fetch the booking document to ensure it exists
          const bookingDoc = await bookingRef.get();
          if (bookingDoc.exists) {
            try {
              // Update the booking status to confirmed
              await bookingRef.update({
                status: 'confirmed',
                paidAt: new Date().toISOString(),
              });
              logger.info(
                `Booking ${bookingId} successfully updated to confirmed.`,
                'Webhook'
              );
            } catch (updateError: unknown) {
              const updateErrObj = updateError instanceof Error
                ? updateError
                : new Error(String(updateError));
              logger.error(
                'Error updating booking status to confirmed.',
                updateErrObj,
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
          const userDoc = await db.collection('users').doc(userId).get();
          const userData = userDoc.data();
          if (userData && userData.email) {
            logger.info(
              `Sending booking confirmation email to ${userData.email}`,
              'Webhook'
            );
            const emailSent = await sendBookingConfirmation(userData.email, {
              session: {
                title: sessionTitle,
                startTime: sessionDate,
                endTime: sessionDate,
                price: sessionPrice,
              },
            });
            if (emailSent) {
              logger.info(
                `Booking confirmation email successfully sent to ${userData.email}`,
                'Webhook'
              );
            } else {
              // Add an Error object here
              logger.error(
                `Failed to send booking confirmation email to ${userData.email}`,
                new Error('Failed to send booking confirmation email'),
                'Webhook'
              );
            }
          } else {
            logger.error(
              'User data or email not found for booking confirmation email.',
              new Error('No user email found'),
              'Webhook'
            );
          }

          return res.json({ received: true });
        } catch (error: unknown) {
          const errObj = error instanceof Error ? error : new Error(String(error));
          logger.error('Error updating booking or sending email:', errObj, 'Webhook');
          if (error instanceof Error) {
            logger.debug(`Error details: ${error.message}`, 'Webhook');
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
