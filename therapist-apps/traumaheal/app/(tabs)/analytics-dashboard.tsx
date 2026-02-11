import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Pressable, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { AnalyticsService, RecoveryScore, TrendData, Milestone } from '../../analytics-service';

export default function AnalyticsDashboardScreen() {
  const [recoveryScore, setRecoveryScore] = useState<RecoveryScore | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const score = await AnalyticsService.calculateRecoveryScore();
      const trendData = await AnalyticsService.getTrendData();
      const milestonesList = await AnalyticsService.getMilestones();

      setRecoveryScore(score);
      setTrends(trendData);
      setMilestones(milestonesList.slice(0, 5));
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!recoveryScore) {
    return (
      <ScreenContainer className="justify-center items-center">
        <Text className="text-muted">Loading analytics...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0 flex-col">
      {/* Header */}
      <View className="bg-primary/10 border-b border-border p-4">
        <Text className="text-2xl font-bold text-foreground">Recovery Analytics</Text>
        <Text className="text-sm text-muted mt-1">Track your healing progress</Text>
      </View>

      {/* Period Selector */}
      <View className="flex-row border-b border-border bg-background">
        {(['week', 'month', 'year'] as const).map(p => (
          <Pressable
            key={p}
            onPress={() => setPeriod(p)}
            className={`flex-1 py-3 border-b-2 ${
              period === p ? 'border-primary' : 'border-transparent'
            }`}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                period === p ? 'text-primary' : 'text-muted'
              }`}
            >
              {p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'Year'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <ScrollView className="flex-1 p-4" contentContainerStyle={{ gap: 16 }}>
        {/* Overall Recovery Score */}
        <View className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 border border-primary/30">
          <Text className="text-white/80 text-sm font-semibold mb-2">Overall Recovery Score</Text>
          <View className="flex-row items-end gap-4">
            <View>
              <Text className="text-5xl font-bold text-white">{recoveryScore.overall}</Text>
              <Text className="text-white/70 text-sm mt-1">/100</Text>
            </View>
            <View className="flex-1">
              <View className="bg-white/20 rounded-full h-2 mb-2">
                <View
                  className="bg-white rounded-full h-2"
                  style={{ width: `${recoveryScore.overall}%` }}
                />
              </View>
              <Text className="text-white/80 text-xs">
                {recoveryScore.trend === 'improving'
                  ? '📈 Improving'
                  : recoveryScore.trend === 'declining'
                    ? '📉 Declining'
                    : '➡️ Stable'}
              </Text>
            </View>
          </View>
        </View>

        {/* Score Breakdown */}
        <View className="bg-surface rounded-2xl p-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">Score Breakdown</Text>

          <View className="gap-3">
            {[
              { label: 'Trauma', score: recoveryScore.trauma, color: 'bg-error' },
              { label: 'Anxiety', score: recoveryScore.anxiety, color: 'bg-warning' },
              { label: 'Mood', score: recoveryScore.mood, color: 'bg-primary' },
              { label: 'Sleep', score: recoveryScore.sleep, color: 'bg-success' },
              { label: 'Engagement', score: recoveryScore.engagement, color: 'bg-info' },
            ].map(item => (
              <View key={item.label}>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm font-semibold text-foreground">{item.label}</Text>
                  <Text className="text-sm font-bold text-primary">{item.score}</Text>
                </View>
                <View className="bg-background rounded-full h-2 overflow-hidden">
                  <View
                    className={`${item.color} h-2 rounded-full`}
                    style={{ width: `${item.score}%` }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Trends */}
        {trends.length > 0 && (
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">Recent Trends</Text>

            <View className="gap-3">
              {trends.map(trend => (
                <View
                  key={trend.label}
                  className="bg-background rounded-xl p-3 flex-row justify-between items-center"
                >
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">
                      {trend.label}
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      {trend.direction === 'up' ? '📈' : trend.direction === 'down' ? '📉' : '➡️'}{' '}
                      {Math.abs(trend.change).toFixed(1)}% {trend.direction === 'up' ? 'increase' : 'decrease'}
                    </Text>
                  </View>
                  <View className="text-right">
                    <Text className="text-lg font-bold text-primary">
                      {Math.round(trend.value)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Milestones */}
        {milestones.length > 0 && (
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">Recent Milestones</Text>

            <View className="gap-2">
              {milestones.map(milestone => (
                <View
                  key={milestone.id}
                  className="bg-background rounded-xl p-3 flex-row items-center gap-3"
                >
                  <Text style={{ fontSize: 24 }}>{milestone.icon}</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">
                      {milestone.title}
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      {new Date(milestone.achievedDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Insights */}
        <View className="bg-primary/10 rounded-2xl p-4 border border-primary/30">
          <Text className="text-lg font-semibold text-foreground mb-3">Key Insights</Text>

          <View className="gap-2">
            <View className="flex-row gap-2">
              <Text className="text-primary font-bold">•</Text>
              <Text className="text-sm text-muted flex-1">
                Your recovery is {recoveryScore.trend === 'improving' ? 'showing positive momentum' : 'stable'}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Text className="text-primary font-bold">•</Text>
              <Text className="text-sm text-muted flex-1">
                Focus on areas with lower scores for maximum improvement
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Text className="text-primary font-bold">•</Text>
              <Text className="text-sm text-muted flex-1">
                Consistency in your therapeutic work is key to sustained healing
              </Text>
            </View>
          </View>
        </View>

        {/* Recommendations */}
        <View className="bg-success/10 rounded-2xl p-4 border border-success/30">
          <Text className="text-lg font-semibold text-foreground mb-3">Recommendations</Text>

          <View className="gap-2">
            {recoveryScore.trauma < 60 && (
              <View className="flex-row gap-2">
                <Text className="text-success font-bold">→</Text>
                <Text className="text-sm text-muted flex-1">
                  Increase EMDR sessions to 3-4 times per week
                </Text>
              </View>
            )}
            {recoveryScore.anxiety < 60 && (
              <View className="flex-row gap-2">
                <Text className="text-success font-bold">→</Text>
                <Text className="text-sm text-muted flex-1">
                  Practice grounding exercises daily
                </Text>
              </View>
            )}
            {recoveryScore.sleep < 60 && (
              <View className="flex-row gap-2">
                <Text className="text-success font-bold">→</Text>
                <Text className="text-sm text-muted flex-1">
                  Implement consistent sleep schedule
                </Text>
              </View>
            )}
            {recoveryScore.overall > 75 && (
              <View className="flex-row gap-2">
                <Text className="text-success font-bold">→</Text>
                <Text className="text-sm text-muted flex-1">
                  Consider working on integration and relapse prevention
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Export Report */}
        <Pressable className="bg-primary rounded-xl p-4 active:opacity-80">
          <Text className="text-center text-background font-semibold">
            📊 Export Full Report
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
