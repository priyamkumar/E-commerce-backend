const asyncHandler = require("express-async-handler");

const stripe = process.env.STRIPE_API_KEY 
  ? require('stripe')(process.env.STRIPE_API_KEY)
  : console.error('Missing Stripe API key');
  
const processPayment = asyncHandler(async (req, res) => {
  const myPayment = await stripe.paymentIntents.create({
    amount: req.body.amount,
    currency: "inr",
    metadata: {
      company: "eCommerce",
    },
  });

  res.status(200).json({
    success: true,
    client_secret: myPayment.client_secret,
  });
});

const sendStripeApiKey = asyncHandler(async (req, res) => {
    res.status(200).json({
      success: true,
      stripeApiKey: process.env.STRIPE_API_KEY,
    });
  });
  
  module.exports = {
    processPayment,
    sendStripeApiKey
  };