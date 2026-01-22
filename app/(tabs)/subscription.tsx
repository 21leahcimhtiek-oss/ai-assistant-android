import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { stripeService, type SubscriptionPlan, type SubscriptionTier } from '@/lib/stripe-service';

export default function SubscriptionScreen() {
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const tier = await stripeService.getCurrentTier();
      setCurrentTier(tier);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (plan: SubscriptionPlan) => {
    if (purchasing) return;

    setPurchasing(true);
    try {
      // In production, this would open Stripe Checkout
      // For now, show a placeholder message
      Alert.alert(
        'Purchase Subscription',
        `You selected ${plan.name} for $${plan.price}/${plan.interval}.\\n\\nIn production, this would open Stripe Checkout to complete your purchase.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: async () => {
              // Simulate successful purchase for demo
              const expiresAt = Date.now() + (plan.interval === 'month' ? 30 : 365) * 24 * 60 * 60 * 1000;
              await stripeService.handleSubscriptionSuccess(
                plan.tier,
                'cus_demo_customer',
                'sub_demo_subscription',
                expiresAt
              );
              await loadSubscription();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to start purchase. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const plans = stripeService.getPlans();
  const monthlyPlans = plans.filter(p => p.interval === 'month');
  const yearlyPlans = plans.filter(p => p.interval === 'year' && p.tier !== 'free');

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return '#9BA1A6';
      case 'premium': return '#6B9BD1';
      case 'pro': return '#8B5CF6';
      default: return '#6B9BD1';
    }
  };

  const getTierBadge = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return '🆓';
      case 'premium': return '⭐';
      case 'pro': return '👑';
      default: return '';
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#6B9BD1" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">
            Choose Your Plan
          </Text>
          <Text className="text-base text-muted">
            Unlock the full power of MindSpace
          </Text>
        </View>

        {/* Current Subscription */}
        {currentTier !== 'free' && (
          <View className="bg-surface rounded-2xl p-5 mb-6 border border-border">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-semibold text-foreground">
                  Current Plan: {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
                </Text>
                <Text className="text-sm text-muted mt-1">
                  Your subscription is active
                </Text>
              </View>
              <Text className="text-4xl">{getTierBadge(currentTier)}</Text>
            </View>
          </View>
        )}

        {/* Monthly Plans */}
        <Text className="text-xl font-bold text-foreground mb-4">Monthly Plans</Text>
        {monthlyPlans.map((plan) => (
          <View
            key={plan.id}
            className={`bg-surface rounded-2xl p-5 mb-4 border-2 ${
              currentTier === plan.tier ? 'border-primary' : 'border-border'
            }`}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Text className="text-2xl mr-2">{getTierBadge(plan.tier)}</Text>
                <View>
                  <Text className="text-xl font-bold text-foreground">{plan.name}</Text>
                  {plan.price > 0 && (
                    <Text className="text-sm text-muted">
                      ${plan.price}/month
                    </Text>
                  )}
                </View>
              </View>
              {currentTier === plan.tier && (
                <View className="bg-primary px-3 py-1 rounded-full">
                  <Text className="text-xs text-background font-semibold">CURRENT</Text>
                </View>
              )}
            </View>

            {/* Features */}
            <View className="mb-4">
              {plan.features.map((feature, index) => (
                <View key={index} className="flex-row items-center mb-2">
                  <Text className="text-primary mr-2">✓</Text>
                  <Text className="text-sm text-foreground flex-1">{feature}</Text>
                </View>
              ))}
            </View>

            {/* Action Button */}
            {currentTier !== plan.tier && plan.tier !== 'free' && (
              <TouchableOpacity
                className="bg-primary py-3 rounded-xl items-center"
                onPress={() => handlePurchase(plan)}
                activeOpacity={0.8}
                disabled={purchasing}
              >
                <Text className="text-background font-semibold">
                  {purchasing ? 'Processing...' : 'Subscribe Now'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Yearly Plans */}
        <Text className="text-xl font-bold text-foreground mb-4 mt-4">
          Yearly Plans (Save More!)
        </Text>
        {yearlyPlans.map((plan) => (
          <View
            key={plan.id}
            className="bg-surface rounded-2xl p-5 mb-4 border-2 border-success"
          >
            <View className="absolute top-3 right-3 bg-success px-3 py-1 rounded-full">
              <Text className="text-xs text-background font-semibold">BEST VALUE</Text>
            </View>

            <View className="flex-row items-center mb-3">
              <Text className="text-2xl mr-2">{getTierBadge(plan.tier)}</Text>
              <View>
                <Text className="text-xl font-bold text-foreground">{plan.name}</Text>
                <Text className="text-sm text-muted">
                  ${plan.price}/year (${(plan.price / 12).toFixed(2)}/month)
                </Text>
              </View>
            </View>

            {/* Features */}
            <View className="mb-4">
              {plan.features.map((feature, index) => (
                <View key={index} className="flex-row items-center mb-2">
                  <Text className="text-success mr-2">✓</Text>
                  <Text className="text-sm text-foreground flex-1">{feature}</Text>
                </View>
              ))}
            </View>

            {/* Action Button */}
            <TouchableOpacity
              className="bg-success py-3 rounded-xl items-center"
              onPress={() => handlePurchase(plan)}
              activeOpacity={0.8}
              disabled={purchasing}
            >
              <Text className="text-background font-semibold">
                {purchasing ? 'Processing...' : 'Subscribe Yearly'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Footer */}
        <View className="bg-surface rounded-2xl p-5 mb-6 border border-border">
          <Text className="text-xs text-muted text-center leading-relaxed">
            All subscriptions auto-renew. Cancel anytime from Settings. By subscribing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
