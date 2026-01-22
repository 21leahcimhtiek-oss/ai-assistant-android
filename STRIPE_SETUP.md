# Stripe Setup Guide for MindSpace

This guide walks you through setting up Stripe for MindSpace's subscription system.

## Overview

MindSpace uses Stripe for subscription management with three tiers:
- **Free**: $0/month (basic features)
- **Premium**: $9.99/month or $79.99/year
- **Pro**: $19.99/month or $159.99/year

---

## Step 1: Create a Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Click "Start now" and create an account
3. Complete the business verification process
4. Navigate to the Dashboard

---

## Step 2: Create Products and Prices

### Create Products

1. In Stripe Dashboard, go to **Products** → **Add product**
2. Create three products:

#### Product 1: MindSpace Premium
- **Name**: MindSpace Premium
- **Description**: Unlimited mood tracking, journaling, AI chat, and CBT exercises
- **Pricing model**: Recurring
- Click "Add pricing"

**Price 1 - Monthly:**
- Price: $9.99
- Billing period: Monthly
- Currency: USD
- **Copy the Price ID** (e.g., `price_1234567890abcdef`) → This is your `price_premium_monthly`

**Price 2 - Yearly:**
- Price: $79.99
- Billing period: Yearly
- Currency: USD
- **Copy the Price ID** → This is your `price_premium_yearly`

#### Product 2: MindSpace Pro
- **Name**: MindSpace Pro
- **Description**: All Premium features plus therapist marketplace and video sessions
- **Pricing model**: Recurring

**Price 1 - Monthly:**
- Price: $19.99
- Billing period: Monthly
- Currency: USD
- **Copy the Price ID** → This is your `price_pro_monthly`

**Price 2 - Yearly:**
- Price: $159.99
- Billing period: Yearly
- Currency: USD
- **Copy the Price ID** → This is your `price_pro_yearly`

---

## Step 3: Update Price IDs in the App

1. Open `lib/stripe-service.ts`
2. Replace the placeholder Price IDs with your actual Stripe Price IDs:

```typescript
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  // ... free tier ...
  {
    id: 'premium_monthly',
    tier: 'premium',
    name: 'Premium Monthly',
    price: 9.99,
    interval: 'month',
    stripePriceId: 'price_YOUR_ACTUAL_PREMIUM_MONTHLY_ID', // ← Replace this
    features: [/* ... */],
  },
  {
    id: 'premium_yearly',
    tier: 'premium',
    name: 'Premium Yearly',
    price: 79.99,
    interval: 'year',
    stripePriceId: 'price_YOUR_ACTUAL_PREMIUM_YEARLY_ID', // ← Replace this
    features: [/* ... */],
  },
  {
    id: 'pro_monthly',
    tier: 'pro',
    name: 'Pro Monthly',
    price: 19.99,
    interval: 'month',
    stripePriceId: 'price_YOUR_ACTUAL_PRO_MONTHLY_ID', // ← Replace this
    features: [/* ... */],
  },
  {
    id: 'pro_yearly',
    tier: 'pro',
    name: 'Pro Yearly',
    price: 159.99,
    interval: 'year',
    stripePriceId: 'price_YOUR_ACTUAL_PRO_YEARLY_ID', // ← Replace this
    features: [/* ... */],
  },
];
```

---

## Step 4: Set Up Backend Server (Required)

**Important**: Stripe requires a backend server for security. You cannot process payments directly from the mobile app.

### Option A: Use the Built-in Server

MindSpace already has a Node.js/Express server. Add Stripe endpoints:

1. Install Stripe SDK on the server:
```bash
cd server
npm install stripe
```

2. Create `server/stripe.ts`:

```typescript
import Stripe from 'stripe';
import { Router } from 'express';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const router = Router();

// Create Checkout Session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { priceId, userId, userEmail } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `YOUR_APP_SCHEME://subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `YOUR_APP_SCHEME://subscription-cancel`,
      customer_email: userEmail,
      metadata: {
        userId,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Webhook to handle subscription events
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      // Update user subscription in your database
      console.log('Subscription created:', session);
      break;
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      // Update subscription status
      console.log('Subscription updated:', subscription);
      break;
    case 'customer.subscription.deleted':
      const deletedSub = event.data.object;
      // Cancel subscription
      console.log('Subscription cancelled:', deletedSub);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Cancel Subscription
router.post('/cancel-subscription', async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    res.json({ success: true, subscription });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

export default router;
```

3. Add to your main server file:
```typescript
import stripeRouter from './stripe';
app.use('/api/stripe', stripeRouter);
```

### Option B: Use Stripe's Mobile SDKs (Alternative)

Use `@stripe/stripe-react-native` for in-app checkout. See [Stripe React Native docs](https://stripe.com/docs/payments/accept-a-payment?platform=react-native).

---

## Step 5: Get Your API Keys

1. In Stripe Dashboard, go to **Developers** → **API keys**
2. Copy your keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### Add Keys to Your Environment

**For the mobile app:**
Create or update `.env`:
```
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

**For the backend server:**
Add to server environment variables:
```
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

---

## Step 6: Set Up Webhooks

Webhooks notify your server when subscription events occur (payment succeeded, subscription cancelled, etc.).

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your endpoint URL: `https://your-server.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. **Copy the Webhook signing secret** → This is your `STRIPE_WEBHOOK_SECRET`

---

## Step 7: Update App Code

1. In `lib/stripe-service.ts`, update the backend URL:

```typescript
const response = await fetch('https://your-server.com/api/stripe/create-checkout-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    priceId: planId,
    userId: 'USER_ID_HERE',
    userEmail: 'user@example.com',
  }),
});
```

2. Handle the success/cancel URLs in your app routing.

---

## Step 8: Test the Integration

### Test Mode

1. Use test API keys (`pk_test_...` and `sk_test_...`)
2. Use [Stripe test cards](https://stripe.com/docs/testing):
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - Any future expiry date and any CVC

3. Test the subscription flow:
   - Open the app
   - Go to Subscription screen
   - Select a plan
   - Complete checkout with test card
   - Verify subscription is created in Stripe Dashboard

### Webhook Testing

Use Stripe CLI to test webhooks locally:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## Step 9: Go Live

1. Complete Stripe account verification
2. Switch to **Live mode** in Stripe Dashboard
3. Get your **live API keys** (`pk_live_...` and `sk_live_...`)
4. Update environment variables with live keys
5. Update webhook endpoint to production URL
6. Test with real payment methods

---

## Additional Features

### Customer Portal

Allow users to manage their subscriptions:

```typescript
router.post('/create-portal-session', async (req, res) => {
  const { customerId } = req.body;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: 'YOUR_APP_SCHEME://settings',
  });

  res.json({ url: session.url });
});
```

### Promo Codes

1. In Stripe Dashboard, go to **Products** → **Coupons**
2. Create coupons (e.g., 20% off first month)
3. Enable in Checkout Session:

```typescript
const session = await stripe.checkout.sessions.create({
  // ...
  allow_promotion_codes: true,
});
```

---

## Troubleshooting

### Common Issues

**Issue**: "No such price: price_..."
- **Solution**: Verify you copied the correct Price ID from Stripe Dashboard

**Issue**: Webhook not receiving events
- **Solution**: Check webhook URL is publicly accessible and HTTPS

**Issue**: "Invalid API key"
- **Solution**: Ensure you're using the correct key for test/live mode

### Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)
- [Stripe Community](https://community.stripe.com)

---

## Security Checklist

- [ ] Never expose Secret API keys in mobile app code
- [ ] Always validate webhooks with signing secret
- [ ] Use HTTPS for all server endpoints
- [ ] Store customer data securely
- [ ] Implement proper error handling
- [ ] Log all payment events for audit trail
- [ ] Test thoroughly before going live

---

## Summary

You need to set up:

1. ✅ Stripe account
2. ✅ Products and Prices in Stripe Dashboard
3. ✅ Update Price IDs in `lib/stripe-service.ts`
4. ✅ Backend server with Stripe endpoints
5. ✅ API keys in environment variables
6. ✅ Webhooks for subscription events
7. ✅ Test with test cards
8. ✅ Go live with real keys

**Estimated setup time**: 1-2 hours

For questions or issues, refer to the [Stripe React Native documentation](https://stripe.com/docs/payments/accept-a-payment?platform=react-native).
