import AsyncStorage from '@react-native-async-storage/async-storage';
import { reviewPrompt } from './review-prompt';
import { wellnessReminders } from './wellness-reminders';

export interface MoodEntry {
  id: string;
  timestamp: number;
  moodLevel: number; // 1-10 scale
  emotions: string[]; // Selected emotions from emotion wheel
  notes?: string;
  triggers?: string[];
  activities?: string[];
}

export interface MoodStats {
  averageMood: number;
  totalEntries: number;
  moodTrend: 'improving' | 'declining' | 'stable';
  commonEmotions: string[];
  commonTriggers: string[];
}

type MoodStatsCache = {
  days: number;
  updatedAt: number;
  value: MoodStats;
};

const MOODS_KEY = '@mindspace_mood_entries';
const MOOD_STATS_CACHE_TTL_MS = 5 * 60 * 1000;

// Emotion wheel categories
export const EMOTIONS = {
  happy: ['joyful', 'content', 'excited', 'peaceful', 'grateful'],
  sad: ['down', 'lonely', 'disappointed', 'hopeless', 'grief'],
  angry: ['frustrated', 'irritated', 'resentful', 'furious', 'annoyed'],
  anxious: ['worried', 'nervous', 'panicked', 'stressed', 'overwhelmed'],
  scared: ['afraid', 'terrified', 'insecure', 'vulnerable', 'threatened'],
  disgusted: ['repulsed', 'disapproving', 'judgmental', 'aversion'],
  surprised: ['amazed', 'confused', 'startled', 'shocked'],
};

// Common triggers
export const COMMON_TRIGGERS = [
  'work',
  'relationships',
  'family',
  'health',
  'finances',
  'social situations',
  'sleep',
  'weather',
  'news',
  'memories',
];

class MoodTrackerService {
  private statsCache: MoodStatsCache | null = null;

  private clearStatsCache() {
    this.statsCache = null;
  }

  private getCachedStats(days: number, now: number): MoodStats | null {
    const cache = this.statsCache;
    if (!cache) {
      return null;
    }

    if (cache.days !== days) {
      return null;
    }

    if (now - cache.updatedAt >= MOOD_STATS_CACHE_TTL_MS) {
      return null;
    }

    return cache.value;
  }

  /**
   * Log a new mood entry
   */
  async logMood(entry: Omit<MoodEntry, 'id' | 'timestamp'>): Promise<MoodEntry> {
    try {
      const newEntry: MoodEntry = {
        ...entry,
        id: `mood_${Date.now()}`,
        timestamp: Date.now(),
      };

      const moods = await this.getAllMoods();
      moods.push(newEntry);
      await AsyncStorage.setItem(MOODS_KEY, JSON.stringify(moods));
      this.clearStatsCache();

      // Track for review prompt
      await reviewPrompt.incrementMoodEntries();

      // Check if wellness reminder needed
      await wellnessReminders.checkAndNotify();

      return newEntry;
    } catch (error) {
      console.error('Error logging mood:', error);
      throw error;
    }
  }

  /**
   * Get all mood entries
   */
  async getAllMoods(): Promise<MoodEntry[]> {
    try {
      const data = await AsyncStorage.getItem(MOODS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading moods:', error);
      return [];
    }
  }

  /**
   * Get mood entries for a specific date range
   */
  async getMoodsByDateRange(startDate: number, endDate: number): Promise<MoodEntry[]> {
    try {
      const allMoods = await this.getAllMoods();
      return allMoods.filter(
        mood => mood.timestamp >= startDate && mood.timestamp <= endDate
      );
    } catch (error) {
      console.error('Error loading moods by date:', error);
      return [];
    }
  }

  /**
   * Get mood entries for the last N days
   */
  async getRecentMoods(days: number = 7): Promise<MoodEntry[]> {
    try {
      const now = Date.now();
      const startDate = now - (days * 24 * 60 * 60 * 1000);
      return await this.getMoodsByDateRange(startDate, now);
    } catch (error) {
      console.error('Error loading recent moods:', error);
      return [];
    }
  }

  /**
   * Get mood statistics
   */
  async getMoodStats(days: number = 30): Promise<MoodStats> {
    try {
      const now = Date.now();
      const cachedStats = this.getCachedStats(days, now);
      if (cachedStats) {
        return cachedStats;
      }

      const moods = await this.getRecentMoods(days);

      if (moods.length === 0) {
        const emptyStats = {
          averageMood: 0,
          totalEntries: 0,
          moodTrend: 'stable',
          commonEmotions: [],
          commonTriggers: [],
        };
        this.statsCache = { days, updatedAt: now, value: emptyStats };
        return emptyStats;
      }

      // Calculate average mood
      const averageMood = moods.reduce((sum, m) => sum + m.moodLevel, 0) / moods.length;

      // Calculate trend (compare first half vs second half)
      const midpoint = Math.floor(moods.length / 2);
      const firstHalf = moods.slice(0, midpoint);
      const secondHalf = moods.slice(midpoint);

      const firstAvg = firstHalf.reduce((sum, m) => sum + m.moodLevel, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, m) => sum + m.moodLevel, 0) / secondHalf.length;

      let moodTrend: 'improving' | 'declining' | 'stable' = 'stable';
      if (secondAvg > firstAvg + 0.5) moodTrend = 'improving';
      else if (secondAvg < firstAvg - 0.5) moodTrend = 'declining';

      // Find common emotions
      const emotionCounts: Record<string, number> = {};
      moods.forEach(mood => {
        mood.emotions.forEach(emotion => {
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });
      });

      const commonEmotions = Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([emotion]) => emotion);

      // Find common triggers
      const triggerCounts: Record<string, number> = {};
      moods.forEach(mood => {
        mood.triggers?.forEach(trigger => {
          triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
        });
      });

      const commonTriggers = Object.entries(triggerCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([trigger]) => trigger);

      const stats = {
        averageMood,
        totalEntries: moods.length,
        moodTrend,
        commonEmotions,
        commonTriggers,
      };
      this.statsCache = { days, updatedAt: now, value: stats };
      return stats;
    } catch (error) {
      console.error('Error calculating mood stats:', error);
      return {
        averageMood: 0,
        totalEntries: 0,
        moodTrend: 'stable',
        commonEmotions: [],
        commonTriggers: [],
      };
    }
  }

  /**
   * Get mood level description
   */
  getMoodDescription(level: number): string {
    if (level >= 9) return 'Great';
    if (level >= 7) return 'Good';
    if (level >= 5) return 'Okay';
    if (level >= 3) return 'Low';
    return 'Bad';
  }

  /**
   * Get mood color based on level
   */
  getMoodColor(level: number): string {
    if (level >= 9) return '#52C41A'; // Great
    if (level >= 7) return '#A8D5BA'; // Good
    if (level >= 5) return '#FFD93D'; // Okay
    if (level >= 3) return '#FFA07A'; // Low
    return '#FF6B6B'; // Bad
  }

  /**
   * Delete a mood entry
   */
  async deleteMood(id: string): Promise<void> {
    try {
      const moods = await this.getAllMoods();
      const filtered = moods.filter(m => m.id !== id);
      await AsyncStorage.setItem(MOODS_KEY, JSON.stringify(filtered));
      this.clearStatsCache();
    } catch (error) {
      console.error('Error deleting mood:', error);
      throw error;
    }
  }

  /**
   * Clear all mood entries
   */
  async clearAllMoods(): Promise<void> {
    try {
      await AsyncStorage.removeItem(MOODS_KEY);
      this.clearStatsCache();
    } catch (error) {
      console.error('Error clearing moods:', error);
      throw error;
    }
  }

  /**
   * Get today's mood entries
   */
  async getTodaysMoods(): Promise<MoodEntry[]> {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const endOfDay = startOfDay + (24 * 60 * 60 * 1000);
      return await this.getMoodsByDateRange(startOfDay, endOfDay);
    } catch (error) {
      console.error('Error loading today\'s moods:', error);
      return [];
    }
  }
}

export const moodTracker = new MoodTrackerService();
