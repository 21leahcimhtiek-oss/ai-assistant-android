import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

/**
 * Stripe Subscription Service
 * Manages subscription tiers and payment processing for MindSpace
 */

export type SubscriptionTier = 'free' | 'premium' | 'pro';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt: number | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  price: number;
  interval: 'month' | 'year';
  stripePriceId: string;
  features: string[];
}

const SUBSCRIPTION_KEY = '@mindspace_subscription';

// Subscription plans
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    tier: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    stripePriceId: '',
    features: [
      'Basic mood tracking',
      '5 journal entries per month',
      'Limited AI chat (10 messages/month)',
      'Basic exercises',
    ],
  },
  {
    id: 'premium_monthly',
    tier: 'premium',
    name: 'Premium Monthly',
    price: 9.99,
    interval: 'month',
    stripePriceId: 'price_premium_monthly', // Replace with actual Stripe Price ID
    features: [
      'Unlimited mood tracking',
      'Unlimited journaling',
      'Unlimited AI therapist chat',
      'All CBT exercises',
      'Progress tracking & insights',
      'Data export (PDF)',
      'Push notifications',
    ],
  },
  {
    id: 'premium_yearly',
    tier: 'premium',
    name: 'Premium Yearly',
    price: 79.99,
    interval: 'year',
    stripePriceId: 'price_premium_yearly', // Replace with actual Stripe Price ID
    features: [
      'All Premium features',
      'Save $40/year',
    ],
  },
  {
    id: 'pro_monthly',
    tier: 'pro',
    name: 'Pro Monthly',
    price: 19.99,
    interval: 'month',
    stripePriceId: 'price_pro_monthly', // Replace with actual Stripe Price ID
    features: [
      'All Premium features',
      'Therapist marketplace access',
      'Video teletherapy booking',
      'Priority support',
      'Advanced analytics',
      'Early access to new features',
    ],
  },
  {
    id: 'pro_yearly',
    tier: 'pro',
    name: 'Pro Yearly',
    price: 159.99,
    interval: 'year',
    stripePriceId: 'price_pro_yearly', // Replace with actual Stripe Price ID
    features: [
      'All Pro features',
      'Save $80/year',
    ],
  },
];

class StripeSubscriptionService {
  private currentSubscription: SubscriptionStatus | null = null;

  /**
   * Initialize subscription service
   */
  async initialize(): Promise<void> {
    try {
      const subscription = await this.getSubscriptionStatus();
      this.currentSubscription = subscription;
    } catch (error) {
      console.error('Error initializing subscription service:', error);
    }
  }

  /**
   * Get current subscription status
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const stored = await AsyncStorage.getItem(SUBSCRIPTION_KEY);
      if (stored) {
        const subscription = JSON.parse(stored) as SubscriptionStatus;
        
        // Check if subscription is expired
        if (subscription.expiresAt && subscription.expiresAt < Date.now()) {
          subscription.isActive = false;
          subscription.tier = 'free';
          await this.saveSubscriptionStatus(subscription);
        }
        
        return subscription;
      }
    } catch (error) {
      console.error('Error getting subscription status:', error);
    }

    // Default to free tier
    const defaultSubscription: SubscriptionStatus = {
      tier: 'free',
      isActive: true,
      expiresAt: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    };
    
    await this.saveSubscriptionStatus(defaultSubscription);
    return defaultSubscription;
  }

  /**
   * Save subscription status
   */
  async saveSubscriptionStatus(subscription: SubscriptionStatus): Promise<void> {
    try {
      await AsyncStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(subscription));
      this.currentSubscription = subscription;
    } catch (error) {
      console.error('Error saving subscription status:', error);
    }
  }

  /**
   * Check if user has access to a feature based on their subscription tier
   */
  async hasFeatureAccess(feature: string): Promise<boolean> {
    const subscription = await this.getSubscriptionStatus();
    
    if (!subscription.isActive) {
      return false;
    }

    // Free tier limitations
    if (subscription.tier === 'free') {
      const freeFeatures = ['basic_mood', 'basic_journal', 'basic_exercises'];
      return freeFeatures.includes(feature);
    }

    // Premium tier has access to most features
    if (subscription.tier === 'premium') {
      const premiumFeatures = [
        'unlimited_mood',
        'unlimited_journal',
        'unlimited_chat',
        'all_exercises',
        'progress_tracking',
        'data_export',
        'notifications',
      ];
      return premiumFeatures.includes(feature);
    }

    // Pro tier has access to everything
    if (subscription.tier === 'pro') {
      return true;
    }

    return false;
  }

  /**
   * Check usage limits for free tier
   */
  async checkUsageLimit(type: 'journal' | 'chat'): Promise<boolean> {
    const subscription = await this.getSubscriptionStatus();
    
    if (subscription.tier !== 'free') {
      return true; // No limits for paid tiers
    }

    try {
      const usageKey = `@mindspace_usage_${type}`;
      const stored = await AsyncStorage.getItem(usageKey);
      const usage = stored ? JSON.parse(stored) : { count: 0, resetAt: Date.now() + 30 * 24 * 60 * 60 * 1000 };

      // Reset usage if month has passed
      if (usage.resetAt < Date.now()) {
        usage.count = 0;
        usage.resetAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      }

      const limits = {
        journal: 5,
        chat: 10,
      };

      if (usage.count >= limits[type]) {
        return false; // Limit reached
      }

      // Increment usage
      usage.count++;
      await AsyncStorage.setItem(usageKey, JSON.stringify(usage));
      return true;
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return true; // Allow on error
    }
  }

  /**
   * Show upgrade prompt
   */
  showUpgradePrompt(feature: string): void {
    Alert.alert(
      'Upgrade Required',
      `This feature requires a Premium or Pro subscription. Upgrade now to unlock ${feature} and more!`,
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'View Plans', onPress: () => {
          // Navigate to subscription screen
          console.log('Navigate to subscription screen');
        }},
      ]
    );
  }

  /**
   * Create Stripe checkout session
   * This should be called from your backend server
   */
  async createCheckoutSession(planId: string): Promise<string | null> {
    try {
      // In production, this would call your backend API
      // Your backend would then create a Stripe Checkout Session
      // and return the session URL
      
      const response = await fetch('YOUR_BACKEND_URL/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          // Add user ID or email here
        }),
      });

      const data = await response.json();
      return data.url; // Stripe Checkout URL
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return null;
    }
  }

  /**
   * Handle successful subscription
   * Called after user completes payment
   */
  async handleSubscriptionSuccess(
    tier: SubscriptionTier,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    expiresAt: number
  ): Promise<void> {
    const subscription: SubscriptionStatus = {
      tier,
      isActive: true,
      expiresAt,
      stripeCustomerId,
      stripeSubscriptionId,
    };

    await this.saveSubscriptionStatus(subscription);
    
    Alert.alert(
      'Subscription Active!',
      `Welcome to MindSpace ${tier === 'premium' ? 'Premium' : 'Pro'}! You now have access to all ${tier} features.`,
      [{ text: 'Get Started' }]
    );
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(): Promise<boolean> {
    try {
      const subscription = await this.getSubscriptionStatus();
      
      if (!subscription.stripeSubscriptionId) {
        return false;
      }

      // In production, call your backend to cancel the Stripe subscription
      const response = await fetch('YOUR_BACKEND_URL/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripeSubscriptionId,
        }),
      });

      if (response.ok) {
        // Update local subscription status
        subscription.isActive = false;
        await this.saveSubscriptionStatus(subscription);
        
        Alert.alert(
          'Subscription Cancelled',
          'Your subscription has been cancelled. You will retain access until the end of your billing period.',
          [{ text: 'OK' }]
        );
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
      return false;
    }
  }

  /**
   * Get subscription plans for display
   */
  getPlans(): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS;
  }

  /**
   * Get current tier
   */
  async getCurrentTier(): Promise<SubscriptionTier> {
    const subscription = await this.getSubscriptionStatus();
    return subscription.tier;
  }
}

export const stripeService = new StripeSubscriptionService();
