import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { progressService, type WellnessScore, type ProgressInsight } from '@/lib/progress';
import { moodTracker } from '@/lib/mood-tracker';
import { LineChart } from 'react-native-chart-kit';
import { useColors } from '@/hooks/use-colors';

export default function ProgressScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [wellnessScore, setWellnessScore] = useState<WellnessScore | null>(null);
  const [insights, setInsights] = useState<ProgressInsight[]>([]);
  const [moodData, setMoodData] = useState<number[]>([]);
  const [moodLabels, setMoodLabels] = useState<string[]>([]);
  const [weeklySummary, setWeeklySummary] = useState({
    moodEntries: 0,
    journalEntries: 0,
    exercisesCompleted: 0,
    therapySessions: 0,
  });

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const [score, insightsData, summary] = await Promise.all([
        progressService.calculateWellnessScore(),
        progressService.generateInsights(),
        progressService.getWeeklySummary(),
      ]);

      setWellnessScore(score);
      setInsights(insightsData);
      setWeeklySummary(summary);

      // Load mood trend data for the past 7 days
      const allMoods = await moodTracker.getAllMoods();
      const last7Days: number[] = [];
      const labels: string[] = [];
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      const rangeStart = now - (6 * dayMs);
      const rangeEnd = rangeStart + (7 * dayMs);
      const moodSums = Array.from({ length: 7 }, () => 0);
      const moodCounts = Array.from({ length: 7 }, () => 0);

      allMoods.forEach(mood => {
        if (mood.timestamp < rangeStart || mood.timestamp >= rangeEnd) {
          return;
        }

        const bucket = Math.floor((mood.timestamp - rangeStart) / dayMs);
        if (bucket >= 0 && bucket < 7) {
          moodSums[bucket] += mood.moodLevel;
          moodCounts[bucket] += 1;
        }
      });

      for (let i = 0; i < 7; i++) {
        const dayStart = rangeStart + (i * dayMs);
        const count = moodCounts[i];
        last7Days.push(count > 0 ? moodSums[i] / count : 5);

        const date = new Date(dayStart);
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      }

      setMoodData(last7Days);
      setMoodLabels(labels);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52C41A';
    if (score >= 60) return '#A8D5BA';
    if (score >= 40) return '#FFD93D';
    if (score >= 20) return '#FFA07A';
    return '#FF6B6B';
  };

  const getInsightIcon = (type: ProgressInsight['type']) => {
    switch (type) {
      case 'positive':
        return '✅';
      case 'concern':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#6B9BD1" />
        <Text className="text-muted mt-4">Loading your progress...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Your Progress</Text>
          <Text className="text-base text-muted">
            Track your mental health journey
          </Text>
        </View>

        {/* Wellness Score */}
        {wellnessScore && (
          <View className="bg-surface rounded-2xl p-6 mb-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">Overall Wellness Score</Text>
            
            <View className="items-center mb-4">
              <View
                className="w-32 h-32 rounded-full items-center justify-center"
                style={{ backgroundColor: `${getScoreColor(wellnessScore.overall)}20` }}
              >
                <Text className="text-4xl font-bold" style={{ color: getScoreColor(wellnessScore.overall) }}>
                  {wellnessScore.overall}
                </Text>
                <Text className="text-sm text-muted">out of 100</Text>
              </View>
              <Text className="text-lg font-semibold text-foreground mt-3">
                {progressService.getScoreDescription(wellnessScore.overall)}
              </Text>
            </View>

            {/* Score Breakdown */}
            <View className="space-y-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">Mood</Text>
                <View className="flex-row items-center">
                  <View className="w-32 h-2 bg-surface rounded-full overflow-hidden mr-2">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${wellnessScore.mood}%`,
                        backgroundColor: getScoreColor(wellnessScore.mood),
                      }}
                    />
                  </View>
                  <Text className="text-sm font-semibold text-foreground w-8">{wellnessScore.mood}</Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">Activity</Text>
                <View className="flex-row items-center">
                  <View className="w-32 h-2 bg-surface rounded-full overflow-hidden mr-2">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${wellnessScore.activity}%`,
                        backgroundColor: getScoreColor(wellnessScore.activity),
                      }}
                    />
                  </View>
                  <Text className="text-sm font-semibold text-foreground w-8">{wellnessScore.activity}</Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">Consistency</Text>
                <View className="flex-row items-center">
                  <View className="w-32 h-2 bg-surface rounded-full overflow-hidden mr-2">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${wellnessScore.consistency}%`,
                        backgroundColor: getScoreColor(wellnessScore.consistency),
                      }}
                    />
                  </View>
                  <Text className="text-sm font-semibold text-foreground w-8">{wellnessScore.consistency}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Mood Trend Chart */}
        {moodData.length > 0 && (
          <View className="bg-surface rounded-2xl p-5 mb-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">Mood Trend (7 Days)</Text>
            <LineChart
              data={{
                labels: moodLabels,
                datasets: [{ data: moodData }],
              }}
              width={Dimensions.get('window').width - 72}
              height={220}
              chartConfig={{
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 1,
                color: (opacity = 1) => colors.primary,
                labelColor: (opacity = 1) => colors.muted,
                style: { borderRadius: 16 },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: colors.primary,
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
            <View className="flex-row justify-between mt-2">
              <Text className="text-xs text-muted">😢 Low</Text>
              <Text className="text-xs text-muted">😊 High</Text>
            </View>
          </View>
        )}

        {/* Weekly Summary */}
        <View className="bg-surface rounded-2xl p-6 mb-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">This Week</Text>
          
          <View className="flex-row flex-wrap">
            <View className="w-1/2 mb-4">
              <Text className="text-3xl font-bold text-primary">{weeklySummary.moodEntries}</Text>
              <Text className="text-sm text-muted">Mood Entries</Text>
            </View>
            <View className="w-1/2 mb-4">
              <Text className="text-3xl font-bold text-primary">{weeklySummary.journalEntries}</Text>
              <Text className="text-sm text-muted">Journal Entries</Text>
            </View>
            <View className="w-1/2">
              <Text className="text-3xl font-bold text-primary">{weeklySummary.exercisesCompleted}</Text>
              <Text className="text-sm text-muted">Exercises Done</Text>
            </View>
            <View className="w-1/2">
              <Text className="text-3xl font-bold text-primary">{weeklySummary.therapySessions}</Text>
              <Text className="text-sm text-muted">Therapy Sessions</Text>
            </View>
          </View>
        </View>

        {/* Insights */}
        {insights.length > 0 && (
          <View className="mb-4">
            <Text className="text-lg font-semibold text-foreground mb-3">Insights</Text>
            {insights.map((insight, index) => (
              <View
                key={index}
                className="bg-surface rounded-2xl p-4 mb-3 border border-border"
              >
                <View className="flex-row items-start">
                  <Text className="text-2xl mr-3">{insight.icon}</Text>
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Text className="text-sm font-semibold text-foreground mr-2">
                        {insight.title}
                      </Text>
                      <Text className="text-xs">{getInsightIcon(insight.type)}</Text>
                    </View>
                    <Text className="text-sm text-muted">{insight.message}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Refresh Button */}
        <TouchableOpacity
          className="bg-primary py-4 rounded-xl items-center mb-6"
          onPress={loadProgress}
          activeOpacity={0.8}
        >
          <Text className="text-background font-semibold">Refresh Progress</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
