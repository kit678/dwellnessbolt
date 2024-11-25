

const stripeSecretKey = process.env.NODE_ENV === 'development'
  ? process.env.VITE_STRIPE_TEST_SECRET_KEY
  : process.env.VITE_STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('Stripe secret key is not defined');
}


// Stripe requires the raw body to construct the event
export const config = {
  api: {
    bodyParser: false,
  },
};

router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event: Stripe.Event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;
      if (!metadata) {
        console.error('Session metadata is missing');
        return res.status(400).send('Session metadata is missing');
      }

      try {
        await db.collection('bookings').doc(bookingId).update({
          status: 'confirmed',
          paidAt: new Date().toISOString(),
        });
        console.log(`Booking ${bookingId} confirmed.`);

        // Fetch user email from Firestore
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (userData && userData.email) {
          await sendBookingConfirmation(userData.email, {
            sessionTitle,
            sessionDate,
            sessionPrice,
          });
          console.log(`Confirmation email sent to ${userData.email}`);
        } else {
          console.error('User data or email not found for booking confirmation email.');
        }
      } catch (error) {
        console.error('Error updating booking or sending confirmation email:', error);
      }
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});




// Stripe requires the raw body to construct the event
export const config = {
  api: {
    bodyParser: false,
  },
};

router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event: Stripe.Event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata.bookingId;
      const userId = session.metadata.userId;
      const sessionTitle = session.metadata.sessionTitle;
      const sessionDate = session.metadata.sessionDate;
      const sessionPrice = session.metadata.sessionPrice;

      try {
        await db.collection('bookings').doc(bookingId).update({
          status: 'confirmed',
          paidAt: new Date().toISOString(),
        });
        console.log(`Booking ${bookingId} confirmed.`);

        // Fetch user email from Firestore
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (userData && userData.email) {
          await sendBookingConfirmation(userData.email, {
            sessionTitle,
            sessionDate,
            sessionPrice,
          });
          console.log(`Confirmation email sent to ${userData.email}`);
        } else {
          console.error('User data or email not found for booking confirmation email.');
        }
      } catch (error) {
        console.error('Error updating booking or sending confirmation email:', error);
      }
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

import express from 'express';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { db } from '../lib/firebase';
import { sendBookingConfirmation } from '../lib/email';

const router = express.Router();


// Stripe requires the raw body to construct the event
export const config = {
  api: {
    bodyParser: false,
  },
};

router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event: Stripe.Event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata.bookingId;
      const userId = session.metadata.userId;
      const sessionTitle = session.metadata.sessionTitle;
      const sessionDate = session.metadata.sessionDate;
      const sessionPrice = session.metadata.sessionPrice;

      try {
        await db.collection('bookings').doc(bookingId).update({
          status: 'confirmed',
          paidAt: new Date().toISOString(),
        });
        console.log(`Booking ${bookingId} confirmed.`);

        // Fetch user email from Firestore
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (userData && userData.email) {
          await sendBookingConfirmation(userData.email, {
            sessionTitle,
            sessionDate,
            sessionPrice,
          });
          console.log(`Confirmation email sent to ${userData.email}`);
        } else {
          console.error('User data or email not found for booking confirmation email.');
        }
      } catch (error) {
        console.error('Error updating booking or sending confirmation email:', error);
      }
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

