import { useEffect } from 'react';
import { router } from 'expo-router';
import { hasCompletedOnboarding } from './onboarding';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    const completed = await hasCompletedOnboarding();
    if (completed) {
      router.replace('/(tabs)');
    } else {
      router.replace('/onboarding');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFE' }}>
      <ActivityIndicator size="large" color="#6B9BD1" />
    </View>
  );
}
