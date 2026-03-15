import { moodTracker, MoodStats } from './mood-tracker';
import { journalService } from './journal';
import { exerciseService } from './exercises';
import { therapyStorage } from './therapy-storage';

export interface WellnessScore {
  overall: number; // 0-100
  mood: number;
  activity: number;
  consistency: number;
  breakdown: {
    moodScore: number;
    journalScore: number;
    exerciseScore: number;
    therapyScore: number;
  };
}

export interface ProgressInsight {
  type: 'positive' | 'neutral' | 'concern';
  title: string;
  message: string;
  icon: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate?: number;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}

class ProgressService {
  /**
   * Calculate overall wellness score
   */
  async calculateWellnessScore(): Promise<WellnessScore> {
    try {
      // Get mood stats (last 30 days)
      const moodStats = await moodTracker.getMoodStats(30);
      const moodScore = this.calculateMoodScore(moodStats);

      // Get journal activity
      const recentEntries = await journalService.getRecentEntries(30);
      const journalScore = this.calculateJournalScore(recentEntries.length);

      // Get exercise completions
      const exerciseCompletions = await exerciseService.getCompletions();
      const recentExercises = exerciseCompletions.filter(
        c => Date.now() - c.timestamp < 30 * 24 * 60 * 60 * 1000
      );
      const exerciseScore = this.calculateExerciseScore(recentExercises.length);

      // Get therapy sessions
      const therapySessions = await therapyStorage.getRecentSessions(30);
      const therapyScore = this.calculateTherapyScore(therapySessions.length);

      // Calculate weighted overall score
      const overall = Math.round(
        moodScore * 0.4 +
        journalScore * 0.2 +
        exerciseScore * 0.2 +
        therapyScore * 0.2
      );

      return {
        overall,
        mood: moodScore,
        activity: Math.round((journalScore + exerciseScore + therapyScore) / 3),
        consistency: this.calculateConsistencyScore(moodStats.totalEntries, recentEntries.length, recentExercises.length),
        breakdown: {
          moodScore,
          journalScore,
          exerciseScore,
          therapyScore,
        },
      };
    } catch (error) {
      console.error('Error calculating wellness score:', error);
      return {
        overall: 0,
        mood: 0,
        activity: 0,
        consistency: 0,
        breakdown: {
          moodScore: 0,
          journalScore: 0,
          exerciseScore: 0,
          therapyScore: 0,
        },
      };
    }
  }

  /**
   * Calculate mood score (0-100)
   */
  private calculateMoodScore(stats: MoodStats): number {
    if (stats.totalEntries === 0) return 50;

    // Average mood is 1-10, convert to 0-100
    const baseScore = (stats.averageMood / 10) * 100;

    // Bonus for improving trend
    if (stats.moodTrend === 'improving') return Math.min(100, baseScore + 10);
    if (stats.moodTrend === 'declining') return Math.max(0, baseScore - 10);

    return Math.round(baseScore);
  }

  /**
   * Calculate journal score (0-100)
   */
  private calculateJournalScore(entryCount: number): number {
    // Target: 15 entries per month (every other day)
    const target = 15;
    const score = Math.min(100, (entryCount / target) * 100);
    return Math.round(score);
  }

  /**
   * Calculate exercise score (0-100)
   */
  private calculateExerciseScore(completionCount: number): number {
    // Target: 20 exercises per month
    const target = 20;
    const score = Math.min(100, (completionCount / target) * 100);
    return Math.round(score);
  }

  /**
   * Calculate therapy score (0-100)
   */
  private calculateTherapyScore(sessionCount: number): number {
    // Target: 10 sessions per month
    const target = 10;
    const score = Math.min(100, (sessionCount / target) * 100);
    return Math.round(score);
  }

  /**
   * Calculate consistency score
   */
  private calculateConsistencyScore(
    moodEntries: number,
    journalEntries: number,
    exerciseCompletions: number
  ): number {
    // Check if user is consistently using the app
    const totalActivities = moodEntries + journalEntries + exerciseCompletions;
    
    // Target: 45 total activities per month (1.5 per day)
    const target = 45;
    const score = Math.min(100, (totalActivities / target) * 100);
    return Math.round(score);
  }

  /**
   * Generate personalized insights
   */
  async generateInsights(): Promise<ProgressInsight[]> {
    const insights: ProgressInsight[] = [];

    try {
      // Mood insights
      const moodStats = await moodTracker.getMoodStats(30);
      if (moodStats.moodTrend === 'improving') {
        insights.push({
          type: 'positive',
          title: 'Mood Improving',
          message: `Your mood has been trending upward! Your average mood is ${moodStats.averageMood.toFixed(1)}/10.`,
          icon: '📈',
        });
      } else if (moodStats.moodTrend === 'declining') {
        insights.push({
          type: 'concern',
          title: 'Mood Declining',
          message: 'Your mood has been lower recently. Consider talking to your therapist or trying some coping exercises.',
          icon: '📉',
        });
      }

      // Common triggers
      if (moodStats.commonTriggers.length > 0) {
        insights.push({
          type: 'neutral',
          title: 'Common Triggers',
          message: `Your most common triggers are: ${moodStats.commonTriggers.slice(0, 3).join(', ')}. Try developing coping strategies for these.`,
          icon: '⚠️',
        });
      }

      // Journal streak
      const streak = await journalService.getWritingStreak();
      if (streak >= 7) {
        insights.push({
          type: 'positive',
          title: 'Writing Streak',
          message: `Amazing! You've journaled for ${streak} days in a row. Keep it up!`,
          icon: '🔥',
        });
      }

      // Exercise usage
      const totalExercises = await exerciseService.getTotalCompletions();
      if (totalExercises >= 10) {
        insights.push({
          type: 'positive',
          title: 'Active Coping',
          message: `You've completed ${totalExercises} coping exercises. You're building great self-care habits!`,
          icon: '💪',
        });
      }

      // Therapy engagement
      const sessionCount = await therapyStorage.getSessionCount();
      if (sessionCount >= 5) {
        insights.push({
          type: 'positive',
          title: 'Therapy Engagement',
          message: `You've had ${sessionCount} therapy sessions. Regular check-ins are key to progress!`,
          icon: '💬',
        });
      }

      // Low activity warning
      const recentMoods = await moodTracker.getRecentMoods(7);
      if (recentMoods.length === 0) {
        insights.push({
          type: 'neutral',
          title: 'Check In',
          message: 'You haven\'t logged your mood this week. Regular tracking helps identify patterns.',
          icon: '📝',
        });
      }

      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }

  /**
   * Get wellness score description
   */
  getScoreDescription(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Needs Attention';
    return 'Critical';
  }

  /**
   * Get score color
   */
  getScoreColor(score: number): string {
    if (score >= 80) return '#52C41A'; // Green
    if (score >= 60) return '#A8D5BA'; // Light green
    if (score >= 40) return '#FFD93D'; // Yellow
    if (score >= 20) return '#FFA07A'; // Orange
    return '#FF6B6B'; // Red
  }

  /**
   * Get activity summary for the week
   */
  async getWeeklySummary(): Promise<{
    moodEntries: number;
    journalEntries: number;
    exercisesCompleted: number;
    therapySessions: number;
  }> {
    try {
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

      const moodEntries = await moodTracker.getRecentMoods(7);
      const journalEntries = await journalService.getRecentEntries(100);
      const weekJournalEntries = journalEntries.filter(
        journalEntry => journalEntry.timestamp >= weekAgo
      );

      const allCompletions = await exerciseService.getCompletions();
      const weekCompletions = allCompletions.filter(
        completion => completion.timestamp >= weekAgo
      );

      const allSessions = await therapyStorage.getAllSessions();
      const weekSessions = allSessions.filter(session => session.startTime >= weekAgo);

      return {
        moodEntries: moodEntries.length,
        journalEntries: weekJournalEntries.length,
        exercisesCompleted: weekCompletions.length,
        therapySessions: weekSessions.length,
      };
    } catch (error) {
      console.error('Error getting weekly summary:', error);
      return {
        moodEntries: 0,
        journalEntries: 0,
        exercisesCompleted: 0,
        therapySessions: 0,
      };
    }
  }
}

export const progressService = new ProgressService();
