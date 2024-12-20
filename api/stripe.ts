import dotenv from 'dotenv';
dotenv.config();
import express, { Router } from 'express';
import Stripe from 'stripe';
const router: Router = express.Router();
const stripeSecretKey =
  process.env.VITE_NODE_ENV === 'development'
    ? process.env.VITE_STRIPE_TEST_SECRET_KEY!
    : process.env.VITE_STRIPE_SECRET_KEY!;

console.log('Stripe Secret Key:', stripeSecretKey ? 'Loaded' : 'Not Loaded');

const stripe = new Stripe(stripeSecretKey || '', {
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
      success_url: `${process.env.VITE_CLIENT_URL}/dashboard?success=true`,
      cancel_url: `${process.env.VITE_CLIENT_URL}/dashboard?canceled=true`,
      metadata: {
        bookingId,
        userId,
        sessionId,
        sessionTitle: req.body.metadata.sessionTitle,
        sessionDate: req.body.metadata.sessionDate,
        sessionPrice: req.body.metadata.sessionPrice,
      },
    });

    console.log(`Checkout session created successfully: ${session.id}`);
    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

export default router;
