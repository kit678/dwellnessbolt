import express from 'express';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { db } from '../src/lib/firebase';

const router = express.Router();

const stripeSecretKey = process.env.NODE_ENV === 'development'
  ? process.env.VITE_STRIPE_TEST_SECRET_KEY
  : process.env.VITE_STRIPE_SECRET_KEY;

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

// Stripe requires the raw body to construct the event
export const config = {
  api: {
    bodyParser: false,
  },
};

router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata.bookingId;
      try {
        await db.collection('bookings').doc(bookingId).update({
          status: 'confirmed',
          paidAt: new Date().toISOString(),
        });
        console.log(`Booking ${bookingId} confirmed.`);
      } catch (error) {
        console.error('Error updating booking:', error);
      }
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
