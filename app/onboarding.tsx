import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const ONBOARDING_KEY = '@mindspace_onboarding_complete';

interface OnboardingSlide {
  id: number;
  emoji: string;
  title: string;
  description: string;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    emoji: '🧠',
    title: 'Welcome to MindSpace',
    description: 'Your personal AI-powered mental health companion. Track your mood, journal your thoughts, and get support whenever you need it.',
    color: '#6B9BD1',
  },
  {
    id: 2,
    emoji: '💬',
    title: 'Talk to Your AI Therapist',
    description: 'Get 24/7 support from an AI therapist trained in CBT techniques. Have meaningful conversations and work through challenges together.',
    color: '#8B5CF6',
  },
  {
    id: 3,
    emoji: '📊',
    title: 'Track Your Progress',
    description: 'Log your daily mood, write journal entries, and complete therapeutic exercises. Watch your wellness improve over time.',
    color: '#10B981',
  },
  {
    id: 4,
    emoji: '👨‍⚕️',
    title: 'Connect with Real Therapists',
    description: 'When you need professional help, easily book video sessions with licensed therapists through our marketplace.',
    color: '#F59E0B',
  },
];

export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      router.replace('/(tabs)');
    }
  };

  const slide = slides[currentSlide];

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-1 p-6">
        {/* Skip Button */}
        {currentSlide < slides.length - 1 && (
          <View className="items-end mb-4">
            <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
              <Text className="text-base text-muted">Skip</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        <View className="flex-1 items-center justify-center">
          {/* Emoji */}
          <Text style={{ fontSize: 120, marginBottom: 40 }}>{slide.emoji}</Text>

          {/* Title */}
          <Text className="text-3xl font-bold text-foreground text-center mb-4 px-4">
            {slide.title}
          </Text>

          {/* Description */}
          <Text className="text-lg text-muted text-center px-8 leading-relaxed">
            {slide.description}
          </Text>
        </View>

        {/* Pagination Dots */}
        <View className="flex-row justify-center mb-8">
          {slides.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full mx-1 ${
                index === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-border'
              }`}
            />
          ))}
        </View>

        {/* Next/Get Started Button */}
        <TouchableOpacity
          className="bg-primary py-4 rounded-2xl items-center"
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text className="text-background text-lg font-semibold">
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch (error) {
    return false;
  }
}
