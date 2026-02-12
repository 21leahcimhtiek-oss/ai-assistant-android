// Stripe Payment Integration Service
// Payment processing for video therapy sessions and premium features

import Stripe from 'stripe';

// Type definitions
type StripeSubscription = any;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceId: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
}

export interface PaymentIntent {
  id: string;
  userId: number;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  description: string;
  metadata: Record<string, any>;
}

export interface Subscription {
  id: string;
  userId: number;
  planId: string;
  stripeSubscriptionId: string;
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    priceId: '',
    amount: 0,
    currency: 'usd',
    interval: 'month',
    features: [
      'All 10 therapy apps',
      'AI therapist (limited)',
      'Basic analytics',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_PRO || '',
    amount: 2900, // $29.00
    currency: 'usd',
    interval: 'month',
    features: [
      'All 10 therapy apps',
      'Unlimited AI therapist',
      'Advanced analytics',
      '4 video therapy sessions/month',
      'Wearable integration',
      'Priority support',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    priceId: process.env.STRIPE_PRICE_PREMIUM || '',
    amount: 9900, // $99.00
    currency: 'usd',
    interval: 'month',
    features: [
      'All 10 therapy apps',
      'Unlimited AI therapist',
      'Premium analytics',
      'Unlimited video therapy',
      'Dedicated therapist',
      'Wearable integration',
      'Priority support',
      'Crisis hotline access',
    ],
  },
};

export class StripeService {
  async createPaymentIntent(userId: number, amount: number, description: string, metadata: Record<string, any> = {}): Promise<PaymentIntent> {
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      description,
      metadata: {
        userId,
        ...metadata,
      },
    });

    return {
      id: intent.id,
      userId,
      amount,
      currency: 'usd',
      status: intent.status as any,
      description,
      metadata: intent.metadata || {},
    };
  }

  async createSubscription(userId: number, planId: string, email: string): Promise<Subscription> {
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan || !plan.priceId) {
      throw new Error(`Invalid plan: ${planId}`);
    }

    // Create or get customer
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId },
      });
      customerId = customer.id;
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: plan.priceId }],
      metadata: { userId, planId },
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    const sub = subscription as any;
    return {
      id: subscription.id,
      userId,
      planId,
      stripeSubscriptionId: subscription.id,
      status: subscription.status as any,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    };
  }

  async getSubscription(userId: number): Promise<Subscription | null> {
    // TODO: Query from database
    return null;
  }

  async cancelSubscription(userId: number): Promise<Subscription> {
    const subscription = await this.getSubscription(userId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const canceled = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    const can = canceled as any;
    return {
      id: canceled.id,
      userId,
      planId: subscription.planId,
      stripeSubscriptionId: canceled.id,
      status: canceled.status as any,
      currentPeriodStart: new Date(can.current_period_start * 1000),
      currentPeriodEnd: new Date(can.current_period_end * 1000),
      cancelAtPeriodEnd: can.cancel_at_period_end,
    };
  }

  async updateSubscription(userId: number, newPlanId: string): Promise<Subscription> {
    const subscription = await this.getSubscription(userId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const newPlan = SUBSCRIPTION_PLANS[newPlanId];
    if (!newPlan || !newPlan.priceId) {
      throw new Error(`Invalid plan: ${newPlanId}`);
    }

    const updated = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [
        {
          id: (await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)).items.data[0].id,
          price: newPlan.priceId,
        },
      ],
    });

    const upd = updated as any;
    return {
      id: updated.id,
      userId,
      planId: newPlanId,
      stripeSubscriptionId: updated.id,
      status: updated.status as any,
      currentPeriodStart: new Date(upd.current_period_start * 1000),
      currentPeriodEnd: new Date(upd.current_period_end * 1000),
      cancelAtPeriodEnd: upd.cancel_at_period_end,
    };
  }

  async processTherapySessionPayment(userId: number, therapistId: number, sessionDurationMinutes: number): Promise<PaymentIntent> {
    // $1 per minute
    const amount = sessionDurationMinutes * 100; // in cents

    return this.createPaymentIntent(
      userId,
      amount,
      `Video therapy session with therapist ${therapistId}`,
      {
        type: 'therapy_session',
        therapistId,
        sessionDurationMinutes,
      }
    );
  }

  async createCheckoutSession(userId: number, planId: string, email: string, successUrl: string, cancelUrl: string): Promise<string> {
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan || !plan.priceId) {
      throw new Error(`Invalid plan: ${planId}`);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email,
      metadata: { userId, planId },
    });

    return session.url || '';
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription ${subscription.id} updated:`, subscription.status);
        // TODO: Update database
        break;

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object as Stripe.Subscription;
        console.log(`Subscription ${deletedSub.id} canceled`);
        // TODO: Update database
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Invoice ${invoice.id} paid`);
        // TODO: Update database
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        console.log(`Invoice ${failedInvoice.id} failed`);
        // TODO: Send notification to user
        break;

      case 'charge.refunded':
        const refund = event.data.object as Stripe.Charge;
        console.log(`Charge ${refund.id} refunded`);
        // TODO: Update database
        break;
    }
  }

  async getInvoices(userId: number): Promise<any[]> {
    // TODO: Query from database
    return [];
  }

  async refundPayment(paymentIntentId: string, reason: string): Promise<void> {
    await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: reason as any,
    });
  }
}

export default new StripeService();
