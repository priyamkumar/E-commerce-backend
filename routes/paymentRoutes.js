const express = require("express");
const { isAuthenticated } = require("../middleware/auth");
const {
  processPayment,
  sendStripeApiKey,
} = require("../controllers/paymentController");
const router = express.Router();

router.post("/process", isAuthenticated, processPayment);
router.get("/stripeapikey", isAuthenticated, sendStripeApiKey);

module.exports = router;
