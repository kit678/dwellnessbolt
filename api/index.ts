import express from 'express';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

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
