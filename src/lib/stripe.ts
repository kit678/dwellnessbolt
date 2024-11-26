import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(
  import.meta.env.VITE_NODE_ENV === 'development'
    ? import.meta.env.VITE_STRIPE_TEST_PUBLIC_KEY
    : import.meta.env.VITE_STRIPE_PUBLIC_KEY
);
