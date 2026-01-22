import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { crisisSupport, type CrisisResource } from '@/lib/crisis-support';

export default function CrisisScreen() {
  const [showSafetyPlan, setShowSafetyPlan] = useState(false);
  const [resources, setResources] = useState<CrisisResource[]>([]);
  const [safetyPlan, setSafetyPlan] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const resourcesData = await crisisSupport.getAllResources();
      const safetyPlanData = await crisisSupport.getSafetyPlan();
      setResources(resourcesData);
      setSafetyPlan(safetyPlanData);
    } catch (error) {
      console.error('Error loading crisis data:', error);
    }
  };

  const callHotline = async (phoneNumber: string) => {
    const url = `tel:${phoneNumber}`;
    const canOpen = await Linking.canOpenURL(url);
    
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      alert('Unable to make phone calls on this device');
    }
  };

  const openWebsite = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      alert('Unable to open website');
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Crisis Support</Text>
          <Text className="text-base text-muted">
            You're not alone. Help is available 24/7.
          </Text>
        </View>

        {/* Emergency Alert */}
        <View className="bg-error/10 rounded-2xl p-6 mb-6 border-2 border-error">
          <Text className="text-2xl font-bold text-error mb-3">
            🚨 In an Emergency
          </Text>
          <Text className="text-base text-foreground mb-4">
            If you or someone else is in immediate danger, please call emergency services right away.
          </Text>
          <TouchableOpacity
            className="bg-error py-4 rounded-xl items-center"
            onPress={() => callHotline('911')}
            activeOpacity={0.8}
          >
            <Text className="text-background font-bold text-lg">Call 911</Text>
          </TouchableOpacity>
        </View>

        {/* Crisis Hotlines */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground mb-4">Crisis Hotlines</Text>
          
          {resources.map((resource) => (
            <View
              key={resource.id}
              className="bg-surface rounded-2xl p-5 mb-3 border border-border"
            >
              <Text className="text-lg font-bold text-foreground mb-2">
                {resource.name}
              </Text>
              <Text className="text-sm text-muted mb-4">
                {resource.description}
              </Text>

              <View className="gap-2">
                {resource.phone && (
                  <TouchableOpacity
                    className="bg-primary py-3 rounded-xl items-center flex-row justify-center"
                    onPress={() => callHotline(resource.phone!)}
                    activeOpacity={0.8}
                  >
                    <Text className="text-background font-semibold mr-2">📞</Text>
                    <Text className="text-background font-semibold">{resource.phone}</Text>
                  </TouchableOpacity>
                )}

                {resource.text && (
                  <TouchableOpacity
                    className="bg-surface border border-primary py-3 rounded-xl items-center flex-row justify-center"
                    onPress={() => Linking.openURL(`sms:${resource.text}`)}
                    activeOpacity={0.8}
                  >
                    <Text className="text-primary font-semibold mr-2">💬</Text>
                    <Text className="text-primary font-semibold">Text {resource.text}</Text>
                  </TouchableOpacity>
                )}

                {resource.website && (
                  <TouchableOpacity
                    className="bg-surface border border-border py-3 rounded-xl items-center flex-row justify-center"
                    onPress={() => openWebsite(resource.website!)}
                    activeOpacity={0.8}
                  >
                    <Text className="text-foreground font-semibold mr-2">🌐</Text>
                    <Text className="text-foreground font-semibold">Visit Website</Text>
                  </TouchableOpacity>
                )}
              </View>

              {resource.available && (
                <Text className="text-xs text-muted mt-3 text-center">
                  Available: {resource.available}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Safety Plan */}
        <View className="mb-6">
          <TouchableOpacity
            className="flex-row items-center justify-between bg-surface rounded-2xl p-5 mb-3 border border-border"
            onPress={() => setShowSafetyPlan(!showSafetyPlan)}
            activeOpacity={0.7}
          >
            <View className="flex-1">
              <Text className="text-xl font-bold text-foreground mb-1">
                🛡️ My Safety Plan
              </Text>
              <Text className="text-sm text-muted">
                Steps to take when in crisis
              </Text>
            </View>
            <Text className="text-2xl text-muted">{showSafetyPlan ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showSafetyPlan && (
            <View className="bg-surface rounded-2xl p-5 border border-border">
              {safetyPlan.map((step, index) => (
                <View key={index} className="mb-4 last:mb-0">
                  <View className="flex-row items-start mb-2">
                    <View className="bg-primary w-6 h-6 rounded-full items-center justify-center mr-3">
                      <Text className="text-background font-bold text-xs">{index + 1}</Text>
                    </View>
                    <Text className="flex-1 text-base font-semibold text-foreground">
                      {step.title}
                    </Text>
                  </View>
                  <Text className="text-sm text-muted ml-9 leading-relaxed">
                    {step.description}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Grounding Exercises */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground mb-4">Quick Grounding Exercises</Text>
          
          <View className="bg-primary/10 rounded-2xl p-5 mb-3 border border-primary/20">
            <Text className="text-lg font-bold text-foreground mb-3">
              5-4-3-2-1 Technique
            </Text>
            <Text className="text-sm text-foreground leading-relaxed mb-2">
              Name out loud:
            </Text>
            <Text className="text-sm text-foreground leading-relaxed">
              • 5 things you can see{'\n'}
              • 4 things you can touch{'\n'}
              • 3 things you can hear{'\n'}
              • 2 things you can smell{'\n'}
              • 1 thing you can taste
            </Text>
          </View>

          <View className="bg-success/10 rounded-2xl p-5 mb-3 border border-success/20">
            <Text className="text-lg font-bold text-foreground mb-3">
              Box Breathing
            </Text>
            <Text className="text-sm text-foreground leading-relaxed">
              • Breathe in for 4 counts{'\n'}
              • Hold for 4 counts{'\n'}
              • Breathe out for 4 counts{'\n'}
              • Hold for 4 counts{'\n'}
              • Repeat 4 times
            </Text>
          </View>
        </View>

        {/* Supportive Message */}
        <View className="bg-surface rounded-2xl p-6 mb-6 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-3 text-center">
            💙 You Matter
          </Text>
          <Text className="text-base text-muted text-center leading-relaxed">
            This feeling is temporary. You've survived 100% of your worst days so far. 
            Reaching out for help is a sign of strength, not weakness.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
