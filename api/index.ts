import dotenv from 'dotenv';
dotenv.config();
import express from 'express';

console.log('Environment Variables:');
console.log('VITE_FIREBASE_API_KEY:', process.env.VITE_FIREBASE_API_KEY);
console.log('VITE_FIREBASE_AUTH_DOMAIN:', process.env.VITE_FIREBASE_AUTH_DOMAIN);
console.log('VITE_FIREBASE_PROJECT_ID:', process.env.VITE_FIREBASE_PROJECT_ID);
console.log('VITE_FIREBASE_STORAGE_BUCKET:', process.env.VITE_FIREBASE_STORAGE_BUCKET);
console.log('VITE_FIREBASE_MESSAGING_SENDER_ID:', process.env.VITE_FIREBASE_MESSAGING_SENDER_ID);
console.log('VITE_FIREBASE_APP_ID:', process.env.VITE_FIREBASE_APP_ID);

import webhookRouter from './webhook.js';
import stripeRouter from './stripe.js';

// Create the express app
const app = express();

// IMPORTANT: Mount the webhook router BEFORE adding JSON parsing middleware.
// The Stripe webhook route needs the raw body, so no JSON parsing should occur before it.
app.use('/webhook', webhookRouter);

// Now it's safe to use JSON parsing for other routes
app.use(express.json());

// Mount other API routes after JSON parsing
app.use('/api/stripe', stripeRouter);

// You can mount other routes as needed
// app.use('/other-routes', otherRouter);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
