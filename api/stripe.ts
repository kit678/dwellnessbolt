import express from 'express';
import Stripe from 'stripe';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../src/lib/firebase';

const router = express.Router();
const stripeSecretKey =
  process.env.NODE_ENV === 'development'
    ? process.env.VITE_STRIPE_TEST_SECRET_KEY!
    : process.env.VITE_STRIPE_SECRET_KEY!;

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

router.post('/create-checkout-session', async (req, res) => {
  try {
    const { sessionId, bookingId, userId, amount } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Wellness Session Booking',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/dashboard?success=true`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard?canceled=true`,
      metadata: {
        bookingId,
        userId,
        sessionId,
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

export default router;
