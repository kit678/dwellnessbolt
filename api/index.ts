import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import stripeRouter from './stripe.js';
import webhookRouter from './webhook.js';

console.log('VITE_NODE_ENV:', process.env.VITE_NODE_ENV);

// Create the express app
const app = express();


// Now it's safe to use JSON parsing for other routes
app.use(express.json());

// Mount other API routes after JSON parsing
app.use('/api/stripe', stripeRouter);

// You can mount other routes as needed
// app.use('/other-routes', otherRouter);

app.use(cors());
app.use(express.json());

// Mount the Stripe routes
app.use('/api/stripe', stripeRouter);

// Mount the webhook route
app.use('/api/webhook', webhookRouter);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
