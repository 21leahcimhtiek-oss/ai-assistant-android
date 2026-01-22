import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * In-App Review Prompt Service
 * Prompts users to review the app at appropriate milestones
 */

const REVIEW_STORAGE_KEY = '@mindspace_review_data';
const DONT_ASK_AGAIN_KEY = '@mindspace_review_dont_ask';

interface ReviewData {
  firstOpenDate: string;
  journalEntriesCount: number;
  moodEntriesCount: number;
  therapySessionsCount: number;
  lastPromptDate?: string;
  hasReviewed: boolean;
}

class ReviewPromptService {
  /**
   * Get current review data
   */
  async getReviewData(): Promise<ReviewData> {
    try {
      const data = await AsyncStorage.getItem(REVIEW_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }

      // Initialize new user data
      const newData: ReviewData = {
        firstOpenDate: new Date().toISOString(),
        journalEntriesCount: 0,
        moodEntriesCount: 0,
        therapySessionsCount: 0,
        hasReviewed: false,
      };

      await AsyncStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(newData));
      return newData;
    } catch (error) {
      console.error('Error getting review data:', error);
      return {
        firstOpenDate: new Date().toISOString(),
        journalEntriesCount: 0,
        moodEntriesCount: 0,
        therapySessionsCount: 0,
        hasReviewed: false,
      };
    }
  }

  /**
   * Update review data
   */
  async updateReviewData(updates: Partial<ReviewData>): Promise<void> {
    try {
      const currentData = await this.getReviewData();
      const newData = { ...currentData, ...updates };
      await AsyncStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(newData));
    } catch (error) {
      console.error('Error updating review data:', error);
    }
  }

  /**
   * Increment journal entries count
   */
  async incrementJournalEntries(): Promise<void> {
    const data = await this.getReviewData();
    await this.updateReviewData({
      journalEntriesCount: data.journalEntriesCount + 1,
    });
    await this.checkAndPrompt();
  }

  /**
   * Increment mood entries count
   */
  async incrementMoodEntries(): Promise<void> {
    const data = await this.getReviewData();
    await this.updateReviewData({
      moodEntriesCount: data.moodEntriesCount + 1,
    });
    await this.checkAndPrompt();
  }

  /**
   * Increment therapy sessions count
   */
  async incrementTherapySessions(): Promise<void> {
    const data = await this.getReviewData();
    await this.updateReviewData({
      therapySessionsCount: data.therapySessionsCount + 1,
    });
    await this.checkAndPrompt();
  }

  /**
   * Check if user has opted out of review prompts
   */
  async hasDontAskAgain(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(DONT_ASK_AGAIN_KEY);
      return value === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Set "don't ask again" preference
   */
  async setDontAskAgain(): Promise<void> {
    try {
      await AsyncStorage.setItem(DONT_ASK_AGAIN_KEY, 'true');
    } catch (error) {
      console.error('Error setting dont ask again:', error);
    }
  }

  /**
   * Check if review is available on this platform
   */
  async isAvailable(): Promise<boolean> {
    try {
      return await StoreReview.isAvailableAsync();
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if conditions are met to show review prompt
   */
  async shouldPrompt(): Promise<boolean> {
    try {
      // Check if user opted out
      const dontAsk = await this.hasDontAskAgain();
      if (dontAsk) {
        return false;
      }

      // Check if available on platform
      const available = await this.isAvailable();
      if (!available) {
        return false;
      }

      const data = await this.getReviewData();

      // Don't prompt if already reviewed
      if (data.hasReviewed) {
        return false;
      }

      // Check if prompted recently (within 30 days)
      if (data.lastPromptDate) {
        const lastPrompt = new Date(data.lastPromptDate);
        const daysSinceLastPrompt = (Date.now() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastPrompt < 30) {
          return false;
        }
      }

      // Check milestones
      const daysSinceFirstOpen = (Date.now() - new Date(data.firstOpenDate).getTime()) / (1000 * 60 * 60 * 24);
      const hasUsed7Days = daysSinceFirstOpen >= 7;
      const has5JournalEntries = data.journalEntriesCount >= 5;
      const has10MoodEntries = data.moodEntriesCount >= 10;
      const has1TherapySession = data.therapySessionsCount >= 1;

      // Prompt if user has been using the app for 7 days AND has completed at least one milestone
      return hasUsed7Days && (has5JournalEntries || has10MoodEntries || has1TherapySession);
    } catch (error) {
      console.error('Error checking should prompt:', error);
      return false;
    }
  }

  /**
   * Check conditions and show review prompt if appropriate
   */
  async checkAndPrompt(): Promise<void> {
    try {
      const should = await this.shouldPrompt();
      if (should) {
        await this.showPrompt();
      }
    } catch (error) {
      console.error('Error in checkAndPrompt:', error);
    }
  }

  /**
   * Show the review prompt
   */
  async showPrompt(): Promise<void> {
    try {
      // Update last prompt date
      await this.updateReviewData({
        lastPromptDate: new Date().toISOString(),
      });

      // Request review
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await StoreReview.requestReview();
        
        // Mark as reviewed (assume user completed it)
        await this.updateReviewData({
          hasReviewed: true,
        });
      }
    } catch (error) {
      console.error('Error showing review prompt:', error);
    }
  }

  /**
   * Manually trigger review prompt (for testing or settings button)
   */
  async manualPrompt(): Promise<void> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        console.log('Review not available on this platform');
        return;
      }

      await StoreReview.requestReview();
      await this.updateReviewData({
        hasReviewed: true,
        lastPromptDate: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in manual prompt:', error);
    }
  }

  /**
   * Reset review data (for testing)
   */
  async reset(): Promise<void> {
    try {
      await AsyncStorage.removeItem(REVIEW_STORAGE_KEY);
      await AsyncStorage.removeItem(DONT_ASK_AGAIN_KEY);
    } catch (error) {
      console.error('Error resetting review data:', error);
    }
  }
}

export const reviewPrompt = new ReviewPromptService();
