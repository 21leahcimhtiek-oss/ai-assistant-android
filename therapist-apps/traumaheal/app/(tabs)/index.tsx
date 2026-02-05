import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TraumaHealHome() {
  const [sessionCount, setSessionCount] = useState(0);
  const [lastSession, setLastSession] = useState<string | null>(null);
  const [recoveryScore, setRecoveryScore] = useState(65);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const sessions = await AsyncStorage.getItem('emdr_hologram_sessions');
      if (sessions) {
        const sessionList = JSON.parse(sessions);
        setSessionCount(sessionList.length);
        if (sessionList.length > 0) {
          const lastDate = new Date(sessionList[sessionList.length - 1].completedAt);
          setLastSession(lastDate.toLocaleDateString());
        }
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="p-6 gap-6">
          {/* Welcome Header */}
          <View className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-8 border border-primary/30">
            <Text className="text-3xl font-bold text-foreground mb-2">
              TraumaHeal
            </Text>
            <Text className="text-base text-muted">
              Holographic Trauma-Focused Therapy with Interactive AR
            </Text>
            <View className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <Text className="text-sm text-primary font-semibold">
                🎯 Immersive healing through advanced technology
              </Text>
            </View>
          </View>

          {/* Recovery Dashboard */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Recovery Progress
            </Text>

            <View className="gap-4">
              {/* Recovery Score */}
              <View className="p-4 bg-background rounded-lg border border-border">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm text-muted">Overall Recovery Score</Text>
                  <Text className="text-2xl font-bold text-primary">{recoveryScore}%</Text>
                </View>
                <View className="w-full h-3 bg-border rounded-full overflow-hidden">
                  <View
                    style={{
                      width: `${recoveryScore}%`,
                      height: '100%',
                      backgroundColor: '#00FF00',
                    }}
                  />
                </View>
              </View>

              {/* Stats Grid */}
              <View className="flex-row gap-3">
                <View className="flex-1 p-3 bg-background rounded-lg border border-border">
                  <Text className="text-xs text-muted mb-1">Sessions</Text>
                  <Text className="text-2xl font-bold text-foreground">{sessionCount}</Text>
                </View>

                <View className="flex-1 p-3 bg-background rounded-lg border border-border">
                  <Text className="text-xs text-muted mb-1">Last Session</Text>
                  <Text className="text-sm font-bold text-foreground">
                    {lastSession || 'Never'}
                  </Text>
                </View>

                <View className="flex-1 p-3 bg-background rounded-lg border border-border">
                  <Text className="text-xs text-muted mb-1">Streak</Text>
                  <Text className="text-2xl font-bold text-primary">3</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Holographic Features */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Holographic Features
            </Text>

            <View className="gap-3">
              {/* EMDR Hologram */}
              <Pressable className="bg-background rounded-xl p-4 border border-border active:opacity-80">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 rounded-lg bg-primary/20 justify-center items-center">
                    <Text style={{ fontSize: 24 }}>🦋</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      EMDR Bilateral Stimulation
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      Holographic butterfly with haptic feedback
                    </Text>
                  </View>
                  <Text className="text-xl">→</Text>
                </View>
              </Pressable>

              {/* Trauma Timeline */}
              <Pressable className="bg-background rounded-xl p-4 border border-border active:opacity-80">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 rounded-lg bg-warning/20 justify-center items-center">
                    <Text style={{ fontSize: 24 }}>📍</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      Trauma Timeline AR
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      Interactive visualization of events
                    </Text>
                  </View>
                  <Text className="text-xl">→</Text>
                </View>
              </Pressable>

              {/* Grounding Exercises */}
              <Pressable className="bg-background rounded-xl p-4 border border-border active:opacity-80">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 rounded-lg bg-success/20 justify-center items-center">
                    <Text style={{ fontSize: 24 }}>🌍</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      Grounding with Haptics
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      5-4-3-2-1 and breathing techniques
                    </Text>
                  </View>
                  <Text className="text-xl">→</Text>
                </View>
              </Pressable>

              {/* Gesture Control */}
              <Pressable className="bg-background rounded-xl p-4 border border-border active:opacity-80">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 rounded-lg bg-primary/20 justify-center items-center">
                    <Text style={{ fontSize: 24 }}>👆</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      Interactive Gestures
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      Swipe, tap, and hand wave controls
                    </Text>
                  </View>
                  <Text className="text-xl">→</Text>
                </View>
              </Pressable>

              {/* Spatial Environment */}
              <Pressable className="bg-background rounded-xl p-4 border border-border active:opacity-80">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 rounded-lg bg-primary/20 justify-center items-center">
                    <Text style={{ fontSize: 24 }}>🌌</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      Spatial Computing
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      Immersive therapeutic environments
                    </Text>
                  </View>
                  <Text className="text-xl">→</Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Holographic Technology Info */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Advanced Holographic Technology
            </Text>

            <View className="gap-3">
              <View className="flex-row gap-3">
                <View className="w-8 h-8 rounded-full bg-primary/20 justify-center items-center">
                  <Text className="text-xs font-bold text-primary">1</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    3D Holographic Visualization
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    Real-time AR rendering of trauma timelines and EMDR patterns
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="w-8 h-8 rounded-full bg-primary/20 justify-center items-center">
                  <Text className="text-xs font-bold text-primary">2</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    Gesture Recognition
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    Hand tracking for bilateral stimulation and interactive controls
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="w-8 h-8 rounded-full bg-primary/20 justify-center items-center">
                  <Text className="text-xs font-bold text-primary">3</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    Haptic Feedback
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    Bilateral tapping and grounding sensations for trauma processing
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="w-8 h-8 rounded-full bg-primary/20 justify-center items-center">
                  <Text className="text-xs font-bold text-primary">4</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    Spatial Computing
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    Immersive environments for safe processing and healing
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Evidence-Based Techniques */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Evidence-Based Techniques
            </Text>

            <View className="gap-2">
              <View className="flex-row items-center gap-2 py-2">
                <Text className="text-primary">✓</Text>
                <Text className="text-sm text-foreground">
                  EMDR (Eye Movement Desensitization and Reprocessing)
                </Text>
              </View>

              <View className="flex-row items-center gap-2 py-2">
                <Text className="text-primary">✓</Text>
                <Text className="text-sm text-foreground">
                  Trauma-Focused Cognitive Behavioral Therapy
                </Text>
              </View>

              <View className="flex-row items-center gap-2 py-2">
                <Text className="text-primary">✓</Text>
                <Text className="text-sm text-foreground">
                  Grounding and Mindfulness Techniques
                </Text>
              </View>

              <View className="flex-row items-center gap-2 py-2">
                <Text className="text-primary">✓</Text>
                <Text className="text-sm text-foreground">
                  Somatic Experiencing
                </Text>
              </View>

              <View className="flex-row items-center gap-2 py-2">
                <Text className="text-primary">✓</Text>
                <Text className="text-sm text-foreground">
                  Safety Planning and Crisis Support
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Start */}
          <View className="bg-primary/10 rounded-2xl p-6 border border-primary/30">
            <Text className="text-lg font-semibold text-foreground mb-3">
              Getting Started
            </Text>

            <Pressable className="bg-primary rounded-xl p-4 active:opacity-80 mb-3">
              <Text className="text-center text-background font-semibold">
                Start EMDR Session
              </Text>
            </Pressable>

            <Pressable className="bg-background rounded-xl p-4 border border-border active:opacity-80">
              <Text className="text-center text-foreground font-semibold">
                View Trauma Timeline
              </Text>
            </Pressable>
          </View>

          {/* Disclaimer */}
          <View className="bg-warning/10 rounded-2xl p-4 border border-warning/30">
            <Text className="text-xs text-muted">
              TraumaHeal is a therapeutic tool designed to complement professional mental health treatment. Always consult with a qualified trauma therapist before beginning any trauma processing work.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
