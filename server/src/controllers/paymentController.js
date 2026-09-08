import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';

// Lazy init - prevents crash on startup when keys not configured
let _razorpay = null;
function getRazorpay() {
  if (!_razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay keys not configured');
    }
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
}

const PLANS = {
  Pro: {
    name: 'The Disciplined',
    amount: 99900,       // ₹999 in paise
    amountDisplay: 999,
    currency: 'INR',
    interval: 'monthly',
  },
  Premium: {
    name: 'The Eternal',
    amount: 1499900,     // ₹14,999 in paise
    amountDisplay: 14999,
    currency: 'INR',
    interval: 'lifetime',
  },
};

// @desc  Create Razorpay order
// @route POST /api/payments/create-order
// @access Private
export const createOrder = async (req, res) => {
  try {
    const { planType } = req.body;
    if (!PLANS[planType]) {
      return res.status(400).json({ message: 'Invalid plan type' });
    }
    const plan = PLANS[planType];
    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount: plan.amount,
      currency: plan.currency,
      receipt: `rcpt_${req.user._id}_${Date.now()}`.slice(0, 40),
      notes: {
        userId: req.user._id.toString(),
        planType,
        userEmail: req.user.email,
        userName: req.user.name,
      },
    });

    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planType,
      planName: plan.name,
      userName: req.user.name,
      userEmail: req.user.email,
    });
  } catch (error) {
    console.error('Razorpay Order Error:', error.message);
    res.status(500).json({ message: 'Payment service error', error: error.message });
  }
};

// @desc  Verify Razorpay payment signature
// @route POST /api/payments/verify
// @access Private
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planType } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planType) {
      return res.status(400).json({ message: 'Missing payment verification fields' });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: 'Payment service not configured' });
    }

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment signature verification failed' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { planType, razorpayPaymentId: razorpay_payment_id, razorpayOrderId: razorpay_order_id },
      { new: true }
    ).select('-passwordHash');

    res.status(200).json({
      success: true,
      message: `Welcome to ${planType} plan!`,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        planType: updatedUser.planType,
      },
    });
  } catch (error) {
    console.error('Verify Error:', error.message);
    res.status(500).json({ message: 'Payment verification failed', error: error.message });
  }
};

// @desc  Handle Razorpay webhooks
// @route POST /api/payments/webhook
// @access Public
export const handleWebhook = async (req, res) => {
  try {
    const sig = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (secret && sig) {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');
      if (expected !== sig) {
        return res.status(400).json({ message: 'Invalid webhook signature' });
      }
    }

    const { event, payload } = req.body || {};

    if (event === 'payment.captured') {
      const payment = payload?.payment?.entity;
      const { userId, planType } = payment?.notes || {};
      if (userId && planType) {
        await User.findByIdAndUpdate(userId, { planType, razorpayPaymentId: payment.id });
        console.log(`Webhook: ${userId} → ${planType}`);
      }
    } else if (event === 'subscription.cancelled') {
      const userId = payload?.subscription?.entity?.notes?.userId;
      if (userId) {
        await User.findByIdAndUpdate(userId, { planType: 'Free' });
        console.log(`Webhook: ${userId} cancelled → Free`);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook Error:', error.message);
    res.status(500).json({ message: 'Webhook error' });
  }
};

// @desc  Demo upgrade (no real payment)
// @route POST /api/payments/demo-upgrade
// @access Private
export const demoUpgrade = async (req, res) => {
  try {
    const { planType } = req.body;
    if (!['Free', 'Pro', 'Premium'].includes(planType)) {
      return res.status(400).json({ message: 'Invalid plan type' });
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { planType },
      { new: true }
    ).select('-passwordHash');

    res.status(200).json({
      message: `Plan set to ${planType} (demo)`,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        planType: updatedUser.planType,
      },
    });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

// @desc  Get subscription info
// @route GET /api/payments/subscription
// @access Private
export const getSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('planType').lean();
    res.status(200).json({
      planType: user.planType,
      hasActiveSubscription: user.planType !== 'Free',
      plans: Object.entries(PLANS).map(([id, p]) => ({
        id,
        name: p.name,
        amount: p.amountDisplay,
        currency: p.currency,
        interval: p.interval,
      })),
    });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};
