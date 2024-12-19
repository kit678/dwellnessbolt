import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import stripeRouter from './stripe.js';
import webhookRouter from './webhook.js';

console.log('NODE_ENV:', process.env.NODE_ENV);

// Create the express app
const app = express();

// Mount the webhook route before other middleware to ensure raw body is available
app.use('/api/webhook', webhookRouter);

// Apply CORS middleware
app.use(cors());

// Apply JSON parsing middleware for other routes
app.use(express.json());

// Mount the Stripe routes
app.use('/api/stripe', stripeRouter);

// You can mount other routes as needed
// app.use('/other-routes', otherRouter);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
