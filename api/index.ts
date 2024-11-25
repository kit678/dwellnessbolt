// api/index.ts

import express from 'express';
import cors from 'cors';
import stripeRouter from './stripe';
import webhookRouter from './webhook'; // Import your webhook router if you have one

const app = express();

app.use(cors());
app.use(express.json());

// Mount the Stripe routes
app.use('/api/stripe', stripeRouter);

// Mount the webhook route
app.use('/api/webhook', webhookRouter);

// Start the server
const PORT = process.env.PORT || 5000; // You can choose your port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
