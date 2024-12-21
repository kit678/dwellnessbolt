import express from 'express';
import Stripe from 'stripe';
import { logger } from '../src/utils/logger.js';
import { db } from '../src/lib/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';
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
      return res.status(400).send(`Webhook Error: ${errorObj.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        logger.info('Processing checkout.session.completed event', 'Webhook');
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata as { [key: string]: string };
        logger.debug(`Session metadata: ${JSON.stringify(metadata)}`, 'Webhook');

        const { bookingId, userId, sessionId } = metadata;
        if (!bookingId || !userId || !sessionId) {
          logger.error(
            'Missing bookingId, userId, or sessionId in session metadata',
            new Error('Missing required metadata fields'),
            'Webhook'
          );
          return res
            .status(400)
            .send('Missing bookingId, userId, or sessionId in session metadata');
        }

        // Fetch session details from Firestore
        const sessionDoc = await db.collection('sessions').doc(sessionId).get();
        if (!sessionDoc.exists) {
          throw new Error(`Session ${sessionId} not found in Firestore.`);
        }
        const sessionData = sessionDoc.data();
        if (!sessionData) {
          throw new Error(`Session data is undefined for session ${sessionId}.`);
        }

        // Fetch booking details from Firestore
        const bookingDoc = await db.collection('bookings').doc(bookingId).get();
        if (!bookingDoc.exists) {
          throw new Error(`Booking ${bookingId} not found in Firestore.`);
        }
        const bookingData = bookingDoc.data();
        if (!bookingData) {
          throw new Error(`Booking data is undefined for booking ${bookingId}.`);
        }

        try {
          await db.runTransaction(async (transaction) => {
            const bookingRef = db.collection('bookings').doc(bookingId);
            const sessionRef = db.collection('sessions').doc(sessionId);

            // Perform all reads first
            const bookingDoc = await transaction.get(bookingRef);
            if (!bookingDoc.exists) {
              throw new Error(`Booking ${bookingId} not found in Firestore.`);
            }

            const sessionDoc = await transaction.get(sessionRef);
            if (!sessionDoc.exists) {
              throw new Error(`Session ${sessionId} not found in Firestore.`);
            }

            const sessionData = sessionDoc.data();
            if (!sessionData) {
              throw new Error(`Session data is undefined for session ${sessionId}.`);
            }

            const dateKey = bookingData.scheduledDate; // Use scheduledDate from booking data

            // Check if there is remaining capacity
            if (
              !sessionData.bookings ||
              !sessionData.bookings[dateKey] ||
              sessionData.bookings[dateKey].remainingCapacity <= 0
            ) {
              throw new Error('No remaining capacity for the selected session date.');
            }

            // Update the booking status to confirmed and set paidAt
            transaction.update(bookingRef, {
              status: 'confirmed',
              paidAt: new Date().toISOString(),
            });

            // Update the session's bookings
            // Ensure confirmedBookings and remainingCapacity are updated correctly
            const dateBooking = sessionData.bookings[dateKey];
            const updatedConfirmedBookings = [...dateBooking.confirmedBookings, { userId, bookingId }];

            transaction.update(sessionRef, {
              [`bookings.${dateKey}.confirmedBookings`]: updatedConfirmedBookings,
              [`bookings.${dateKey}.remainingCapacity`]: dateBooking.remainingCapacity - 1,
            });
            logger.debug(
              `Updated bookings for dateKey ${dateKey} with bookingId ${bookingId}`,
              'Webhook'
            );
          });

          logger.info(
            `Booking ${bookingId} confirmed and session ${sessionId} updated successfully.`,
            'Webhook'
          );

          // Fetch user email outside the transaction
          const userDoc = await db.collection('users').doc(userId).get();
          const userData = userDoc.data();
          if (userData && userData.email) {
            logger.info(
              `Sending booking confirmation email to ${userData.email}`,
              'Webhook'
            );
            const emailSent = await sendBookingConfirmation(userData.email, {
              session: {
                title: sessionData.title,
                startTime: sessionData.startTime,
                endTime: sessionData.endTime,
                price: sessionData.price,
                description: sessionData.description,
                specializedTopic: sessionData.specializedTopic,
                image: sessionData.image,
              },
            });
            if (emailSent) {
              logger.info(
                `Booking confirmation email successfully sent to ${userData.email}`,
                'Webhook'
              );
            } else {
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
