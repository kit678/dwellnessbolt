import { loadStripe } from '@stripe/stripe-js';

const isDevelopment = import.meta.env.VITE_NODE_ENV === 'development';
const stripeKey = isDevelopment
  ? import.meta.env.VITE_STRIPE_TEST_PUBLIC_KEY
  : import.meta.env.VITE_STRIPE_PUBLIC_KEY;

console.log(`Using ${isDevelopment ? 'test' : 'live'} Stripe public key`);

export const stripePromise = loadStripe(stripeKey);
