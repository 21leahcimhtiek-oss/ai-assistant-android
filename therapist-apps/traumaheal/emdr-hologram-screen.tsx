import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  ScrollView,
  Pressable,
  Dimensions,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { EMDRHologramService, HapticFeedbackService } from './holographic-ar';

const { width, height } = Dimensions.get('window');

interface EMDRHologramScreenProps {
  targetMemory?: string;
  onSessionComplete?: (intensityReduction: number) => void;
}

export const EMDRHologramScreen: React.FC<EMDRHologramScreenProps> = ({
  targetMemory = 'Process traumatic memory',
  onSessionComplete,
}) => {
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [bilateralPattern, setBilateralPattern] = useState<'horizontal' | 'diagonal' | 'circular' | 'figure-eight'>('horizontal');
  const [speed, setSpeed] = useState(5);
  const [visualStyle, setVisualStyle] = useState<'butterfly' | 'lights' | 'waves' | 'particles'>('butterfly');
  const [intensityBefore, setIntensityBefore] = useState(8);
  const [intensityAfter, setIntensityAfter] = useState(8);

  const butterflyX = useRef(new Animated.Value(0)).current;
  const butterflyY = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  // Timer for session
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (sessionActive) {
      interval = setInterval(() => {
        setSessionTime(t => t + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionActive]);

  // Animate bilateral movement
  useEffect(() => {
    if (!sessionActive) return;

    const animateBilateral = () => {
      const duration = 2000 / (speed / 5);
      const frames = EMDRHologramService.generateBilateralPattern(bilateralPattern, speed);

      Animated.loop(
        Animated.sequence(
          frames.map((frame, index) =>
            Animated.parallel([
              Animated.timing(butterflyX, {
                toValue: frame.x * width * 0.3,
                duration: duration / frames.length,
                useNativeDriver: false,
              }),
              Animated.timing(butterflyY, {
                toValue: frame.y * height * 0.2,
                duration: duration / frames.length,
                useNativeDriver: false,
              }),
            ])
          )
        )
      ).start();
    };

    animateBilateral();
  }, [sessionActive, bilateralPattern, speed]);

  // Pulse animation for glow effect
  useEffect(() => {
    if (!sessionActive) return;

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
  }, [sessionActive]);

  // Haptic feedback during session
  useEffect(() => {
    if (!sessionActive) return;

    const hapticInterval = setInterval(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, (2000 / (speed / 5)) / 2);

    return () => clearInterval(hapticInterval);
  }, [sessionActive, speed]);

  const startSession = async () => {
    setSessionActive(true);
    setSessionTime(0);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const completeSession = async () => {
    setSessionActive(false);
    const intensityReduction = intensityBefore - intensityAfter;
    
    await EMDRHologramService.completeSession(
      {
        id: Date.now().toString(),
        targetMemory,
        bilateralPattern,
        speed,
        duration: sessionTime,
        visualStyle,
        hapticFeedback: true,
      },
      intensityReduction
    );

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSessionComplete?.(intensityReduction);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="p-6 gap-6">
          {/* Session Header */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <Text className="text-2xl font-bold text-foreground mb-2">
              EMDR Holographic Therapy
            </Text>
            <Text className="text-sm text-muted">
              {targetMemory}
            </Text>
          </View>

          {/* Holographic Visualization */}
          <View className="bg-surface rounded-2xl p-6 border border-border overflow-hidden">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Bilateral Stimulation Visualization
            </Text>

            <View
              style={{
                width: '100%',
                height: 250,
                backgroundColor: '#0a0e27',
                borderRadius: 12,
                borderWidth: 2,
                borderColor: '#FF69B4',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Glow Background */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 200,
                  height: 200,
                  borderRadius: 100,
                  backgroundColor: '#FF69B4',
                  opacity: glowOpacity,
                  transform: [{ scale: pulseScale }],
                }}
              />

              {/* Butterfly/Visual Element */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: '#FF69B4',
                  opacity: sessionActive ? 0.9 : 0.3,
                  transform: [
                    { translateX: butterflyX },
                    { translateY: butterflyY },
                  ],
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 40 }}>🦋</Text>
              </Animated.View>

              {/* Center Marker */}
              <View
                style={{
                  position: 'absolute',
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#FFD700',
                  opacity: 0.6,
                }}
              />

              {/* Status Text */}
              <Text className="absolute bottom-4 text-xs text-muted">
                {sessionActive ? 'Session Active' : 'Ready to Start'}
              </Text>
            </View>
          </View>

          {/* Session Controls */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Session Controls
            </Text>

            {/* Timer */}
            <View className="mb-4 p-4 bg-background rounded-lg border border-border">
              <Text className="text-center text-3xl font-bold text-primary">
                {formatTime(sessionTime)}
              </Text>
            </View>

            {/* Start/Stop Button */}
            <Pressable
              onPress={sessionActive ? completeSession : startSession}
              className={`rounded-xl p-4 mb-4 ${
                sessionActive ? 'bg-error' : 'bg-success'
              } active:opacity-80`}
            >
              <Text className="text-center text-background font-semibold">
                {sessionActive ? 'Complete Session' : 'Start Session'}
              </Text>
            </Pressable>

            {/* Pattern Selection */}
            <Text className="text-sm font-semibold text-foreground mb-2">
              Bilateral Pattern
            </Text>
            <View className="flex-row gap-2 mb-4">
              {(['horizontal', 'diagonal', 'circular', 'figure-eight'] as const).map(pattern => (
                <Pressable
                  key={pattern}
                  onPress={() => setBilateralPattern(pattern)}
                  className={`flex-1 p-3 rounded-lg ${
                    bilateralPattern === pattern ? 'bg-primary' : 'bg-background border border-border'
                  }`}
                >
                  <Text
                    className={`text-center text-xs font-semibold ${
                      bilateralPattern === pattern ? 'text-background' : 'text-foreground'
                    }`}
                  >
                    {pattern === 'figure-eight' ? '∞' : pattern.charAt(0).toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Speed Control */}
            <Text className="text-sm font-semibold text-foreground mb-2">
              Speed: {speed}x
            </Text>
            <View className="flex-row gap-2 mb-4">
              {[1, 3, 5, 7, 10].map(s => (
                <Pressable
                  key={s}
                  onPress={() => setSpeed(s)}
                  className={`flex-1 p-3 rounded-lg ${
                    speed === s ? 'bg-primary' : 'bg-background border border-border'
                  }`}
                >
                  <Text
                    className={`text-center text-xs font-semibold ${
                      speed === s ? 'text-background' : 'text-foreground'
                    }`}
                  >
                    {s}x
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Visual Style */}
            <Text className="text-sm font-semibold text-foreground mb-2">
              Visual Style
            </Text>
            <View className="flex-row gap-2">
              {(['butterfly', 'lights', 'waves', 'particles'] as const).map(style => (
                <Pressable
                  key={style}
                  onPress={() => setVisualStyle(style)}
                  className={`flex-1 p-3 rounded-lg ${
                    visualStyle === style ? 'bg-primary' : 'bg-background border border-border'
                  }`}
                >
                  <Text
                    className={`text-center text-xs font-semibold capitalize ${
                      visualStyle === style ? 'text-background' : 'text-foreground'
                    }`}
                  >
                    {style.charAt(0)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Intensity Rating */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Trauma Intensity Rating
            </Text>

            <View className="gap-4">
              {/* Before */}
              <View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm text-muted">Before Session</Text>
                  <Text className="text-lg font-bold text-error">{intensityBefore}/10</Text>
                </View>
                <View className="flex-row gap-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Pressable
                      key={`before-${i}`}
                      onPress={() => setIntensityBefore(i + 1)}
                      className={`flex-1 h-8 rounded-lg ${
                        i < intensityBefore ? 'bg-error' : 'bg-background border border-border'
                      }`}
                    />
                  ))}
                </View>
              </View>

              {/* After */}
              <View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm text-muted">After Session</Text>
                  <Text className="text-lg font-bold text-success">{intensityAfter}/10</Text>
                </View>
                <View className="flex-row gap-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Pressable
                      key={`after-${i}`}
                      onPress={() => setIntensityAfter(i + 1)}
                      className={`flex-1 h-8 rounded-lg ${
                        i < intensityAfter ? 'bg-success' : 'bg-background border border-border'
                      }`}
                    />
                  ))}
                </View>
              </View>

              {/* Reduction */}
              <View className="p-3 bg-background rounded-lg border border-border">
                <Text className="text-sm text-muted mb-1">Intensity Reduction</Text>
                <Text className="text-2xl font-bold text-primary">
                  {intensityBefore - intensityAfter} points
                </Text>
              </View>
            </View>
          </View>

          {/* Session Notes */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Session Information
            </Text>

            <View className="gap-2">
              <View className="flex-row justify-between items-center py-2 px-3 bg-background rounded-lg">
                <Text className="text-sm text-muted">Pattern</Text>
                <Text className="text-sm text-foreground font-semibold capitalize">
                  {bilateralPattern}
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-2 px-3 bg-background rounded-lg">
                <Text className="text-sm text-muted">Speed</Text>
                <Text className="text-sm text-foreground font-semibold">
                  {speed}x
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-2 px-3 bg-background rounded-lg">
                <Text className="text-sm text-muted">Visual Style</Text>
                <Text className="text-sm text-foreground font-semibold capitalize">
                  {visualStyle}
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-2 px-3 bg-background rounded-lg">
                <Text className="text-sm text-muted">Haptic Feedback</Text>
                <Text className="text-sm text-foreground font-semibold">✓ Enabled</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

export default EMDRHologramScreen;
