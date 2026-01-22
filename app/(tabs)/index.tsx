import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { moodTracker } from '@/lib/mood-tracker';
import { progressService } from '@/lib/progress';

export default function HomeScreen() {
  const router = useRouter();
  const [todayMood, setTodayMood] = useState<number | null>(null);
  const [wellnessScore, setWellnessScore] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load today's mood
      const todayMoods = await moodTracker.getTodaysMoods();
      if (todayMoods.length > 0) {
        setTodayMood(todayMoods[todayMoods.length - 1].moodLevel);
      }

      // Load wellness score
      const summary = await progressService.getWeeklySummary();
      const totalActivity = summary.moodEntries + summary.journalEntries + summary.exercisesCompleted;
      setWellnessScore(Math.min(totalActivity * 5, 100)); // Simple score calculation
      setStreak(summary.moodEntries); // Use mood entries as streak proxy
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const getMoodEmoji = (mood: number | null) => {
    if (mood === null) return '😊';
    if (mood >= 9) return '😄';
    if (mood >= 7) return '🙂';
    if (mood >= 5) return '😐';
    if (mood >= 3) return '😔';
    return '😢';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-4xl font-bold text-foreground mb-2">
            {getGreeting()} 👋
          </Text>
          <Text className="text-base text-muted">
            How are you feeling today?
          </Text>
        </View>

        {/* Daily Check-in */}
        <TouchableOpacity
          className="bg-gradient-to-r from-primary to-primary/80 rounded-3xl p-6 mb-6 shadow-lg"
          style={{ backgroundColor: '#6B9BD1' }}
          onPress={() => router.push('/mood')}
          activeOpacity={0.9}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-background/80 text-sm font-semibold mb-1">
                Daily Check-in
              </Text>
              <Text className="text-background text-2xl font-bold mb-2">
                {todayMood !== null ? `Mood: ${todayMood}/10` : 'Log Your Mood'}
              </Text>
              <Text className="text-background/80 text-sm">
                {todayMood !== null ? 'Update your mood' : 'How are you feeling right now?'}
              </Text>
            </View>
            <Text className="text-6xl">{getMoodEmoji(todayMood)}</Text>
          </View>
        </TouchableOpacity>

        {/* Wellness Overview */}
        <View className="bg-surface rounded-2xl p-6 mb-6 border border-border">
          <Text className="text-xl font-bold text-foreground mb-4">Your Wellness</Text>
          
          <View className="flex-row justify-between mb-4">
            <View className="flex-1 items-center">
              <View className="bg-primary/10 w-20 h-20 rounded-full items-center justify-center mb-2">
                <Text className="text-3xl font-bold text-primary">{wellnessScore}</Text>
              </View>
              <Text className="text-sm text-muted">Score</Text>
            </View>

            <View className="flex-1 items-center">
              <View className="bg-success/10 w-20 h-20 rounded-full items-center justify-center mb-2">
                <Text className="text-3xl font-bold text-success">{streak}</Text>
              </View>
              <Text className="text-sm text-muted">Day Streak</Text>
            </View>
          </View>

          <TouchableOpacity
            className="bg-primary py-3 rounded-xl items-center"
            onPress={() => router.push('/progress')}
            activeOpacity={0.8}
          >
            <Text className="text-background font-semibold">View Full Progress</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-foreground mb-4">Quick Actions</Text>
          
          <View className="flex-row flex-wrap gap-3">
            <TouchableOpacity
              className="flex-1 min-w-[45%] bg-surface rounded-2xl p-5 border border-border"
              onPress={() => router.push('/chat')}
              activeOpacity={0.7}
            >
              <Text className="text-3xl mb-2">💬</Text>
              <Text className="text-base font-semibold text-foreground mb-1">
                Talk to AI Therapist
              </Text>
              <Text className="text-xs text-muted">Get support anytime</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 min-w-[45%] bg-surface rounded-2xl p-5 border border-border"
              onPress={() => router.push('/journal')}
              activeOpacity={0.7}
            >
              <Text className="text-3xl mb-2">📖</Text>
              <Text className="text-base font-semibold text-foreground mb-1">
                Journal
              </Text>
              <Text className="text-xs text-muted">Reflect on your day</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 min-w-[45%] bg-surface rounded-2xl p-5 border border-border"
              onPress={() => router.push('/exercises')}
              activeOpacity={0.7}
            >
              <Text className="text-3xl mb-2">🧘</Text>
              <Text className="text-base font-semibold text-foreground mb-1">
                Exercises
              </Text>
              <Text className="text-xs text-muted">CBT tools & techniques</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 min-w-[45%] bg-surface rounded-2xl p-5 border border-border"
              onPress={() => router.push('/therapists')}
              activeOpacity={0.7}
            >
              <Text className="text-3xl mb-2">👨‍⚕️</Text>
              <Text className="text-base font-semibold text-foreground mb-1">
                Find Therapist
              </Text>
              <Text className="text-xs text-muted">Connect with professionals</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Crisis Support Banner */}
        <TouchableOpacity
          className="bg-error/10 rounded-2xl p-5 mb-6 border-2 border-error/30"
          onPress={() => router.push('/crisis')}
          activeOpacity={0.8}
        >
          <View className="flex-row items-center">
            <Text className="text-3xl mr-4">🆘</Text>
            <View className="flex-1">
              <Text className="text-lg font-bold text-error mb-1">
                Need Immediate Help?
              </Text>
              <Text className="text-sm text-foreground">
                Access crisis resources and support 24/7
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Settings Link */}
        <TouchableOpacity
          className="bg-surface rounded-2xl p-5 mb-6 border border-border"
          onPress={() => router.push('/settings')}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">⚙️</Text>
              <Text className="text-base font-semibold text-foreground">Settings</Text>
            </View>
            <Text className="text-muted">→</Text>
          </View>
        </TouchableOpacity>

        {/* Motivational Quote */}
        <View className="bg-primary/5 rounded-2xl p-6 mb-6">
          <Text className="text-base text-foreground italic text-center leading-relaxed">
            "You don't have to be positive all the time. It's perfectly okay to feel sad, angry, annoyed, frustrated, scared, and anxious. Having feelings doesn't make you a negative person. It makes you human."
          </Text>
          <Text className="text-sm text-muted text-center mt-3">— Lori Deschene</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
