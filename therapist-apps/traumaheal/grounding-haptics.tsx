import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { HapticFeedbackService } from './holographic-ar';

const { width, height } = Dimensions.get('window');

interface GroundingExercise {
  id: string;
  name: string;
  description: string;
  technique: '5-4-3-2-1' | 'box-breathing' | 'body-scan' | 'grounding-tap' | 'progressive-muscle';
  duration: number; // seconds
  hapticIntensity: number; // 0-1
}

interface GroundingHapticsProps {
  onExerciseComplete?: (exerciseId: string, intensity: number) => void;
}

export const GroundingHaptics: React.FC<GroundingHapticsProps> = ({
  onExerciseComplete,
}) => {
  const [activeExercise, setActiveExercise] = useState<GroundingExercise | null>(null);
  const [exerciseTime, setExerciseTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [anxietyBefore, setAnxietyBefore] = useState(7);
  const [anxietyAfter, setAnxietyAfter] = useState(7);
  const [currentStep, setCurrentStep] = useState(0);

  const pulseScale = useRef(new Animated.Value(1)).current;
  const breathingScale = useRef(new Animated.Value(1)).current;

  const exercises: GroundingExercise[] = [
    {
      id: 'grounding-5-4-3-2-1',
      name: '5-4-3-2-1 Grounding',
      description: 'Notice 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste',
      technique: '5-4-3-2-1',
      duration: 300,
      hapticIntensity: 0.6,
    },
    {
      id: 'box-breathing',
      name: 'Box Breathing',
      description: 'Breathe in for 4, hold for 4, out for 4, hold for 4',
      technique: 'box-breathing',
      duration: 240,
      hapticIntensity: 0.5,
    },
    {
      id: 'body-scan',
      name: 'Body Scan',
      description: 'Progressive awareness from head to toe',
      technique: 'body-scan',
      duration: 300,
      hapticIntensity: 0.4,
    },
    {
      id: 'grounding-tap',
      name: 'Grounding Tap',
      description: 'Rhythmic bilateral tapping with haptic feedback',
      technique: 'grounding-tap',
      duration: 180,
      hapticIntensity: 0.7,
    },
    {
      id: 'progressive-muscle',
      name: 'Progressive Muscle Relaxation',
      description: 'Tense and release muscle groups sequentially',
      technique: 'progressive-muscle',
      duration: 360,
      hapticIntensity: 0.6,
    },
  ];

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRunning && activeExercise) {
      interval = setInterval(() => {
        setExerciseTime(t => {
          if (t >= activeExercise.duration) {
            completeExercise();
            return t;
          }
          return t + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, activeExercise]);

  // Haptic feedback based on exercise type
  useEffect(() => {
    if (!isRunning || !activeExercise) return;

    const hapticInterval = setInterval(async () => {
      switch (activeExercise.technique) {
        case '5-4-3-2-1':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'box-breathing':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'grounding-tap':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          await new Promise(resolve => setTimeout(resolve, 200));
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'progressive-muscle':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
      }
    }, 2000);

    return () => clearInterval(hapticInterval);
  }, [isRunning, activeExercise]);

  const startExercise = async (exercise: GroundingExercise) => {
    setActiveExercise(exercise);
    setExerciseTime(0);
    setIsRunning(true);
    setCurrentStep(0);

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const completeExercise = async () => {
    setIsRunning(false);
    if (activeExercise) {
      onExerciseComplete?.(activeExercise.id, anxietyBefore - anxietyAfter);
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const pauseExercise = async () => {
    setIsRunning(!isRunning);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Animate pulsing effect
  useEffect(() => {
    if (!isRunning) return;

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [isRunning]);

  // Breathing animation
  useEffect(() => {
    if (!isRunning || activeExercise?.technique !== 'box-breathing') return;

    Animated.loop(
      Animated.sequence([
        // Inhale
        Animated.timing(breathingScale, {
          toValue: 1.3,
          duration: 4000,
          useNativeDriver: false,
        }),
        // Hold
        Animated.timing(breathingScale, {
          toValue: 1.3,
          duration: 4000,
          useNativeDriver: false,
        }),
        // Exhale
        Animated.timing(breathingScale, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: false,
        }),
        // Hold
        Animated.timing(breathingScale, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [isRunning, activeExercise?.technique]);

  return (
    <ScreenContainer className="p-0">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="p-6 gap-6">
          {/* Header */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <Text className="text-2xl font-bold text-foreground mb-2">
              Grounding Exercises
            </Text>
            <Text className="text-sm text-muted">
              Haptic-enabled techniques for anxiety relief
            </Text>
          </View>

          {/* Active Exercise Display */}
          {activeExercise && (
            <View className="bg-surface rounded-2xl p-6 border border-primary">
              <Text className="text-xl font-semibold text-foreground mb-4">
                {activeExercise.name}
              </Text>

              {/* Timer */}
              <View className="mb-6 p-4 bg-background rounded-lg border border-border">
                <Text className="text-center text-4xl font-bold text-primary mb-2">
                  {formatTime(exerciseTime)}
                </Text>
                <View className="w-full h-2 bg-border rounded-full overflow-hidden">
                  <View
                    style={{
                      width: `${(exerciseTime / activeExercise.duration) * 100}%`,
                      height: '100%',
                      backgroundColor: '#00FF00',
                    }}
                  />
                </View>
              </View>

              {/* Visual Feedback */}
              {activeExercise.technique === 'box-breathing' && (
                <Animated.View
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: '#00D4FF',
                    alignSelf: 'center',
                    marginBottom: 20,
                    opacity: 0.7,
                    transform: [{ scale: breathingScale }],
                  }}
                />
              )}

              {activeExercise.technique === 'grounding-tap' && (
                <View className="flex-row justify-center gap-4 mb-6">
                  <Animated.View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: '#FF69B4',
                      transform: [{ scale: pulseScale }],
                    }}
                  />
                  <Animated.View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: '#FF69B4',
                      transform: [{ scale: pulseScale }],
                    }}
                  />
                </View>
              )}

              {activeExercise.technique === '5-4-3-2-1' && (
                <View className="mb-6 p-4 bg-background rounded-lg">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Current Step: {currentStep + 1}/5
                  </Text>
                  <View className="flex-row gap-1">
                    {[5, 4, 3, 2, 1].map((count, index) => (
                      <View
                        key={index}
                        className={`flex-1 h-2 rounded-full ${
                          index <= currentStep ? 'bg-primary' : 'bg-border'
                        }`}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Controls */}
              <View className="flex-row gap-3 mb-4">
                <Pressable
                  onPress={pauseExercise}
                  className="flex-1 bg-warning rounded-xl p-4 active:opacity-80"
                >
                  <Text className="text-center text-background font-semibold">
                    {isRunning ? 'Pause' : 'Resume'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={completeExercise}
                  className="flex-1 bg-error rounded-xl p-4 active:opacity-80"
                >
                  <Text className="text-center text-background font-semibold">
                    Stop
                  </Text>
                </Pressable>
              </View>

              {/* Description */}
              <Text className="text-sm text-muted">
                {activeExercise.description}
              </Text>
            </View>
          )}

          {/* Anxiety Rating */}
          {activeExercise && (
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-4">
                Anxiety Level
              </Text>

              <View className="gap-4">
                {/* Before */}
                <View>
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-sm text-muted">Before</Text>
                    <Text className="text-lg font-bold text-error">{anxietyBefore}/10</Text>
                  </View>
                  <View className="flex-row gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <Pressable
                        key={`before-${i}`}
                        onPress={() => setAnxietyBefore(i + 1)}
                        className={`flex-1 h-8 rounded-lg ${
                          i < anxietyBefore ? 'bg-error' : 'bg-background border border-border'
                        }`}
                      />
                    ))}
                  </View>
                </View>

                {/* After */}
                <View>
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-sm text-muted">After</Text>
                    <Text className="text-lg font-bold text-success">{anxietyAfter}/10</Text>
                  </View>
                  <View className="flex-row gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <Pressable
                        key={`after-${i}`}
                        onPress={() => setAnxietyAfter(i + 1)}
                        className={`flex-1 h-8 rounded-lg ${
                          i < anxietyAfter ? 'bg-success' : 'bg-background border border-border'
                        }`}
                      />
                    ))}
                  </View>
                </View>

                {/* Improvement */}
                <View className="p-3 bg-background rounded-lg border border-border">
                  <Text className="text-sm text-muted mb-1">Improvement</Text>
                  <Text className="text-2xl font-bold text-primary">
                    {anxietyBefore - anxietyAfter} points
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Exercise Selection */}
          {!activeExercise && (
            <View className="gap-3">
              {exercises.map(exercise => (
                <Pressable
                  key={exercise.id}
                  onPress={() => startExercise(exercise)}
                  className="bg-surface rounded-2xl p-6 border border-border active:opacity-80"
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-foreground">
                        {exercise.name}
                      </Text>
                      <Text className="text-xs text-muted mt-1">
                        {exercise.description}
                      </Text>
                    </View>
                    <View className="bg-primary rounded-lg px-3 py-1">
                      <Text className="text-xs font-semibold text-background">
                        {Math.floor(exercise.duration / 60)}m
                      </Text>
                    </View>
                  </View>

                  {/* Haptic Intensity Indicator */}
                  <View className="flex-row gap-1 mt-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <View
                        key={i}
                        className={`flex-1 h-1 rounded-full ${
                          i < Math.ceil(exercise.hapticIntensity * 5)
                            ? 'bg-primary'
                            : 'bg-border'
                        }`}
                      />
                    ))}
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* Tips */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Tips for Best Results
            </Text>

            <View className="gap-2">
              <Text className="text-sm text-muted">
                • Find a quiet, comfortable space
              </Text>
              <Text className="text-sm text-muted">
                • Focus on the haptic feedback sensations
              </Text>
              <Text className="text-sm text-muted">
                • Practice regularly for maximum benefit
              </Text>
              <Text className="text-sm text-muted">
                • Combine with deep breathing techniques
              </Text>
              <Text className="text-sm text-muted">
                • Track your progress over time
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

export default GroundingHaptics;
