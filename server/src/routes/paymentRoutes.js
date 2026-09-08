import express from 'express';
import {
  createOrder,
  verifyPayment,
  handleWebhook,
  demoUpgrade,
  getSubscription,
} from '../controllers/paymentController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Webhook — public, raw body for signature verification
router.post('/webhook', express.json(), handleWebhook);

// Protected routes
router.use(protect);
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.post('/demo-upgrade', demoUpgrade);
router.get('/subscription', getSubscription);

export default router;
