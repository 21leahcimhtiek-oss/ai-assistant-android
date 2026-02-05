import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { GestureRecognitionService, GestureEvent } from './holographic-ar';

const { width, height } = Dimensions.get('window');

interface InteractiveGestureControlProps {
  onGestureDetected?: (gesture: GestureEvent) => void;
  onBilateralTapDetected?: () => void;
  onHandWaveDetected?: () => void;
  enabled?: boolean;
  visualFeedback?: boolean;
}

export const InteractiveGestureControl: React.FC<InteractiveGestureControlProps> = ({
  onGestureDetected,
  onBilateralTapDetected,
  onHandWaveDetected,
  enabled = true,
  visualFeedback = true,
}) => {
  const [gestureDetected, setGestureDetected] = useState<string | null>(null);
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => enabled,
      onMoveShouldSetPanResponder: () => enabled,
      onPanResponderGrant: () => {
        if (visualFeedback) {
          Animated.spring(scale, {
            toValue: 1.1,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const { dx, dy, vx, vy } = gestureState;
        
        panX.setValue(dx);
        panY.setValue(dy);

        // Detect swipe direction
        const velocity = Math.sqrt(vx * vx + vy * vy);
        if (velocity > 0.5) {
          let direction: 'left' | 'right' | 'up' | 'down' | null = null;
          
          if (Math.abs(dx) > Math.abs(dy)) {
            direction = dx > 0 ? 'right' : 'left';
          } else {
            direction = dy > 0 ? 'down' : 'up';
          }

          if (direction && direction !== swipeDirection) {
            setSwipeDirection(direction);
            
            const gesture: GestureEvent = {
              type: 'swipe',
              direction,
              intensity: Math.min(velocity, 1),
              timestamp: Date.now(),
            };

            GestureRecognitionService.processGesture(gesture);
            onGestureDetected?.(gesture);

            if (visualFeedback) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          }
        }
      },
      onPanResponderRelease: () => {
        Animated.parallel([
          Animated.spring(panX, { toValue: 0, useNativeDriver: false }),
          Animated.spring(panY, { toValue: 0, useNativeDriver: false }),
          Animated.spring(scale, { toValue: 1, useNativeDriver: false }),
        ]).start();

        setSwipeDirection(null);
      },
    })
  ).current;

  // Detect tap gestures
  const handleTap = async () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;

    if (timeSinceLastTap < 300) {
      setTapCount(tapCount + 1);

      // Double tap detected
      if (tapCount === 1) {
        const gesture: GestureEvent = {
          type: 'tap',
          intensity: 0.8,
          timestamp: now,
        };

        GestureRecognitionService.processGesture(gesture);
        onGestureDetected?.(gesture);

        if (visualFeedback) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          Animated.sequence([
            Animated.timing(scale, { toValue: 0.95, duration: 100, useNativeDriver: false }),
            Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: false }),
          ]).start();
        }

        setTapCount(0);
      }
    } else {
      setTapCount(1);
    }

    setLastTapTime(now);
  };

  // Simulate bilateral hand tapping (for EMDR)
  const simulateBilateralTap = async () => {
    if (visualFeedback) {
      // Haptic pattern for bilateral stimulation
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await new Promise(resolve => setTimeout(resolve, 200));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onBilateralTapDetected?.();
  };

  // Simulate hand wave gesture (for grounding)
  const simulateHandWave = async () => {
    if (visualFeedback) {
      // Wave pattern
      for (let i = 0; i < 3; i++) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }

    onHandWaveDetected?.();
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-6 gap-6">
        {/* Gesture Detection Area */}
        <View className="bg-surface rounded-2xl p-6 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">
            Gesture Control Zone
          </Text>
          
          <Animated.View
            {...panResponder.panHandlers}
            style={{
              width: '100%',
              height: 200,
              backgroundColor: '#1a1a2e',
              borderRadius: 12,
              borderWidth: 2,
              borderColor: '#00D4FF',
              justifyContent: 'center',
              alignItems: 'center',
              transform: [
                { translateX: panX },
                { translateY: panY },
                { scale },
              ],
              opacity,
            }}
          >
            <Pressable onPress={handleTap} style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
              <Text className="text-center text-muted">
                {gestureDetected || 'Tap, Swipe, or Pinch'}
              </Text>
              <Text className="text-xs text-muted mt-2">
                {swipeDirection && `Direction: ${swipeDirection}`}
              </Text>
            </Pressable>
          </Animated.View>

          <Text className="text-xs text-muted mt-3">
            Try swiping in any direction or double-tapping
          </Text>
        </View>

        {/* EMDR Bilateral Tap Control */}
        <View className="bg-surface rounded-2xl p-6 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">
            EMDR Bilateral Stimulation
          </Text>
          
          <Pressable
            onPress={simulateBilateralTap}
            className="bg-primary rounded-xl p-4 active:opacity-80"
          >
            <Text className="text-center text-background font-semibold">
              Start Bilateral Tap
            </Text>
          </Pressable>

          <Text className="text-xs text-muted mt-3">
            Alternating haptic feedback stimulates bilateral brain processing
          </Text>
        </View>

        {/* Hand Wave Grounding Control */}
        <View className="bg-surface rounded-2xl p-6 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">
            Hand Wave Grounding
          </Text>
          
          <Pressable
            onPress={simulateHandWave}
            className="bg-success rounded-xl p-4 active:opacity-80"
          >
            <Text className="text-center text-background font-semibold">
              Wave Hand Pattern
            </Text>
          </Pressable>

          <Text className="text-xs text-muted mt-3">
            Rhythmic hand movements activate grounding reflexes
          </Text>
        </View>

        {/* Gesture History */}
        <View className="bg-surface rounded-2xl p-6 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">
            Recent Gestures
          </Text>
          
          <View className="gap-2">
            <View className="flex-row justify-between items-center py-2 px-3 bg-background rounded-lg">
              <Text className="text-sm text-muted">Swipe Left</Text>
              <Text className="text-xs text-primary">Detected</Text>
            </View>
            <View className="flex-row justify-between items-center py-2 px-3 bg-background rounded-lg">
              <Text className="text-sm text-muted">Double Tap</Text>
              <Text className="text-xs text-primary">Detected</Text>
            </View>
            <View className="flex-row justify-between items-center py-2 px-3 bg-background rounded-lg">
              <Text className="text-sm text-muted">Bilateral Tap</Text>
              <Text className="text-xs text-primary">Active</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default InteractiveGestureControl;
