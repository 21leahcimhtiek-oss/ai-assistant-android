// MindSpace Home Screen
// Mood tracking, journaling, and AI insights

import { ScrollView, Text, View, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import mindspaceService from '@/therapist-apps/mindspace/mindspace-service';

export default function MindSpaceHome() {
  const { user, isAuthenticated } = useAuth();
  const [todayMood, setTodayMood] = useState<number | null>(null);
  const [dailyInsight, setDailyInsight] = useState<string>('');
  const [moodPattern, setMoodPattern] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadMoodData();
    }
  }, [isAuthenticated, user]);

  const loadMoodData = async () => {
    try {
      setLoading(true);
      const history = await mindspaceService.getMoodHistory(user!.id, 1);
      if (history.length > 0) {
        setTodayMood(history[0].moodScore);
      }

      const insight = await mindspaceService.generateDailyInsight(user!.id);
      setDailyInsight(insight);

      const pattern = await mindspaceService.analyzeMoodPattern(user!.id, 'week');
      setMoodPattern(pattern);
    } catch (error) {
      console.error('Error loading mood data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (score: number | null) => {
    if (score === null) return '😐';
    if (score <= 2) return '😢';
    if (score <= 4) return '😕';
    if (score <= 6) return '😐';
    if (score <= 8) return '🙂';
    return '😄';
  };

  const getMoodLabel = (score: number | null) => {
    if (score === null) return 'Not recorded';
    if (score <= 2) return 'Terrible';
    if (score <= 4) return 'Bad';
    if (score <= 6) return 'Okay';
    if (score <= 8) return 'Good';
    return 'Great';
  };

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-xl font-bold text-foreground">Please log in to continue</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">MindSpace</Text>
            <Text className="text-base text-muted">Your mental health companion</Text>
          </View>

          {/* Today's Mood */}
          <View className="bg-surface rounded-2xl p-6 gap-4">
            <Text className="text-lg font-semibold text-foreground">Today's Mood</Text>
            <View className="flex-row items-center justify-between">
              <View className="items-center gap-2">
                <Text className="text-6xl">{getMoodEmoji(todayMood)}</Text>
                <Text className="text-2xl font-bold text-foreground">{todayMood || '—'}/10</Text>
                <Text className="text-sm text-muted">{getMoodLabel(todayMood)}</Text>
              </View>
              <Pressable className="flex-1 ml-4 bg-primary rounded-xl p-4 active:opacity-80">
                <Text className="text-center font-semibold text-background">Log Mood</Text>
              </Pressable>
            </View>
          </View>

          {/* Daily Insight */}
          {dailyInsight && (
            <View className="bg-primary/10 rounded-2xl p-4 gap-2 border border-primary">
              <Text className="text-sm font-semibold text-primary">💡 Daily Insight</Text>
              <Text className="text-base text-foreground leading-relaxed">{dailyInsight}</Text>
            </View>
          )}

          {/* Weekly Trend */}
          {moodPattern && (
            <View className="bg-surface rounded-2xl p-6 gap-4">
              <Text className="text-lg font-semibold text-foreground">Weekly Overview</Text>
              <View className="gap-3">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted">Average Mood</Text>
                  <Text className="text-lg font-bold text-foreground">{moodPattern.averageMood}/10</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted">Trend</Text>
                  <Text className={`text-lg font-bold ${moodPattern.trend === 'improving' ? 'text-success' : moodPattern.trend === 'declining' ? 'text-error' : 'text-muted'}`}>
                    {moodPattern.trend === 'improving' ? '📈 Improving' : moodPattern.trend === 'declining' ? '📉 Declining' : '➡️ Stable'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <View className="gap-3">
            <Pressable className="bg-primary rounded-xl p-4 active:opacity-80">
              <Text className="text-center font-semibold text-background">📔 Write Journal</Text>
            </Pressable>
            <Pressable className="bg-surface border border-border rounded-xl p-4 active:opacity-80">
              <Text className="text-center font-semibold text-foreground">📊 View Analytics</Text>
            </Pressable>
            <Pressable className="bg-surface border border-border rounded-xl p-4 active:opacity-80">
              <Text className="text-center font-semibold text-foreground">💬 Chat with AI</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
