import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { moodTracker } from './mood-tracker';

/**
 * Smart Wellness Reminder Service
 * Analyzes mood patterns and suggests exercises when mood drops
 */

const WELLNESS_SETTINGS_KEY = '@mindspace_wellness_reminders';
const LAST_REMINDER_KEY = '@mindspace_last_wellness_reminder';

interface WellnessSettings {
  enabled: boolean;
  moodThreshold: number; // Default 5 - trigger if mood below this for 3 days
  consecutiveDays: number; // Default 3 - number of consecutive days to check
}

interface MoodPattern {
  isLow: boolean;
  consecutiveLowDays: number;
  averageMood: number;
  trend: 'improving' | 'declining' | 'stable';
}

class WellnessReminderService {
  /**
   * Get wellness reminder settings
   */
  async getSettings(): Promise<WellnessSettings> {
    try {
      const data = await AsyncStorage.getItem(WELLNESS_SETTINGS_KEY);
      if (data) {
        return JSON.parse(data);
      }

      // Default settings
      const defaultSettings: WellnessSettings = {
        enabled: true,
        moodThreshold: 5,
        consecutiveDays: 3,
      };

      await AsyncStorage.setItem(WELLNESS_SETTINGS_KEY, JSON.stringify(defaultSettings));
      return defaultSettings;
    } catch (error) {
      console.error('Error getting wellness settings:', error);
      return {
        enabled: true,
        moodThreshold: 5,
        consecutiveDays: 3,
      };
    }
  }

  /**
   * Update wellness reminder settings
   */
  async updateSettings(settings: Partial<WellnessSettings>): Promise<void> {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...settings };
      await AsyncStorage.setItem(WELLNESS_SETTINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating wellness settings:', error);
    }
  }

  /**
   * Analyze recent mood patterns
   */
  async analyzeMoodPattern(): Promise<MoodPattern> {
    try {
      const moods = await moodTracker.getAllMoods();
      const settings = await this.getSettings();

      if (moods.length === 0) {
        return {
          isLow: false,
          consecutiveLowDays: 0,
          averageMood: 5,
          trend: 'stable',
        };
      }

      // Sort by date descending
      const sortedMoods = moods.sort((a, b) => b.timestamp - a.timestamp);

      // Group moods by day
      const moodsByDay: { [date: string]: number[] } = {};
      sortedMoods.forEach(mood => {
        const date = new Date(mood.timestamp).toDateString();
        if (!moodsByDay[date]) {
          moodsByDay[date] = [];
        }
        moodsByDay[date].push(mood.moodLevel);
      });

      // Calculate average mood per day
      const dailyAverages = Object.entries(moodsByDay)
        .map(([date, moods]) => ({
          date,
          average: moods.reduce((sum, m) => sum + m, 0) / moods.length,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Check for consecutive low mood days
      let consecutiveLowDays = 0;
      for (const day of dailyAverages) {
        if (day.average < settings.moodThreshold) {
          consecutiveLowDays++;
        } else {
          break;
        }
      }

      // Calculate overall average
      const recentMoods = sortedMoods.slice(0, 10);
      const averageMood = recentMoods.reduce((sum, m) => sum + m.moodLevel, 0) / recentMoods.length;

      // Determine trend
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (dailyAverages.length >= 3) {
        const recent = dailyAverages.slice(0, 3).reduce((sum, d) => sum + d.average, 0) / 3;
        const older = dailyAverages.slice(3, 6).reduce((sum, d) => sum + d.average, 0) / Math.min(3, dailyAverages.length - 3);
        
        if (recent > older + 0.5) {
          trend = 'improving';
        } else if (recent < older - 0.5) {
          trend = 'declining';
        }
      }

      return {
        isLow: consecutiveLowDays >= settings.consecutiveDays,
        consecutiveLowDays,
        averageMood,
        trend,
      };
    } catch (error) {
      console.error('Error analyzing mood pattern:', error);
      return {
        isLow: false,
        consecutiveLowDays: 0,
        averageMood: 5,
        trend: 'stable',
      };
    }
  }

  /**
   * Check if we should send a wellness reminder
   */
  async shouldSendReminder(): Promise<boolean> {
    try {
      const settings = await this.getSettings();
      
      if (!settings.enabled) {
        return false;
      }

      // Check last reminder time (don't send more than once per day)
      const lastReminderStr = await AsyncStorage.getItem(LAST_REMINDER_KEY);
      if (lastReminderStr) {
        const lastReminder = new Date(lastReminderStr);
        const hoursSinceLastReminder = (Date.now() - lastReminder.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastReminder < 24) {
          return false;
        }
      }

      // Analyze mood pattern
      const pattern = await this.analyzeMoodPattern();
      
      return pattern.isLow;
    } catch (error) {
      console.error('Error checking should send reminder:', error);
      return false;
    }
  }

  /**
   * Send a wellness reminder notification
   */
  async sendReminder(): Promise<void> {
    try {
      const pattern = await this.analyzeMoodPattern();

      // Select appropriate message based on pattern
      let title = 'Check in with yourself';
      let body = 'Your mood has been low lately. Try a grounding exercise or talk to your AI therapist.';

      if (pattern.trend === 'declining') {
        title = 'We noticed your mood is declining';
        body = `You've had ${pattern.consecutiveLowDays} days of low mood. Let's try a breathing exercise or journal about what's on your mind.`;
      } else if (pattern.consecutiveLowDays >= 5) {
        title = 'Your wellbeing matters';
        body = `It's been ${pattern.consecutiveLowDays} days of low mood. Consider reaching out to a therapist or trying our guided exercises.`;
      }

      // Send notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'wellness_reminder',
            screen: 'exercises',
          },
        },
        trigger: null, // Send immediately
      });

      // Update last reminder time
      await AsyncStorage.setItem(LAST_REMINDER_KEY, new Date().toISOString());
    } catch (error) {
      console.error('Error sending wellness reminder:', error);
    }
  }

  /**
   * Check mood pattern and send reminder if needed
   */
  async checkAndNotify(): Promise<void> {
    try {
      const should = await this.shouldSendReminder();
      if (should) {
        await this.sendReminder();
      }
    } catch (error) {
      console.error('Error in checkAndNotify:', error);
    }
  }

  /**
   * Get suggested exercises based on mood pattern
   */
  async getSuggestedExercises(): Promise<string[]> {
    try {
      const pattern = await this.analyzeMoodPattern();

      if (pattern.isLow) {
        return [
          'breathing', // Breathing exercise
          'grounding', // 5-4-3-2-1 grounding
          'thought-challenging', // Thought challenging
        ];
      }

      if (pattern.trend === 'declining') {
        return [
          'gratitude', // Gratitude practice
          'thought-challenging', // Thought challenging
        ];
      }

      return [];
    } catch (error) {
      console.error('Error getting suggested exercises:', error);
      return [];
    }
  }

  /**
   * Reset reminder data (for testing)
   */
  async reset(): Promise<void> {
    try {
      await AsyncStorage.removeItem(WELLNESS_SETTINGS_KEY);
      await AsyncStorage.removeItem(LAST_REMINDER_KEY);
    } catch (error) {
      console.error('Error resetting wellness reminders:', error);
    }
  }
}

export const wellnessReminders = new WellnessReminderService();
