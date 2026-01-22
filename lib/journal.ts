import AsyncStorage from '@react-native-async-storage/async-storage';
import { reviewPrompt } from './review-prompt';

export interface JournalEntry {
  id: string;
  timestamp: number;
  title?: string;
  content: string;
  mood?: number;
  emotions?: string[];
  prompt?: string; // The prompt used if this was a guided entry
  isFavorite: boolean;
}

const JOURNAL_KEY = '@mindspace_journal_entries';

// Daily journal prompts organized by category
export const JOURNAL_PROMPTS = {
  gratitude: [
    "What are three things you're grateful for today?",
    "Who made a positive impact on your life recently?",
    "What small moment brought you joy today?",
    "What's something you often take for granted that you appreciate?",
    "Describe a happy memory from this week.",
  ],
  reflection: [
    "What did you learn about yourself today?",
    "What challenged you today and how did you handle it?",
    "What would you do differently if you could relive today?",
    "What are you proud of accomplishing recently?",
    "How have you grown in the past month?",
  ],
  emotions: [
    "How are you really feeling right now? Dig deeper than fine.",
    "What emotion have you been avoiding? Why?",
    "Describe a moment when you felt truly at peace.",
    "What's weighing on your mind lately?",
    "If your current emotion had a color and shape, what would it be?",
  ],
  coping: [
    "What's one healthy way you coped with stress today?",
    "What do you need to let go of?",
    "Write a letter to your anxious self.",
    "What would you tell a friend going through what you're experiencing?",
    "What's one small thing you can do tomorrow to take care of yourself?",
  ],
  goals: [
    "What's one step you can take toward your goals this week?",
    "What's holding you back from what you want?",
    "Describe your ideal day. What would it look like?",
    "What would you do if you weren't afraid?",
    "What does success mean to you?",
  ],
  relationships: [
    "Who do you need to reach out to?",
    "What relationship in your life needs attention?",
    "How can you be a better friend/partner/family member?",
    "What boundaries do you need to set?",
    "Who brings out the best in you? Why?",
  ],
  challenges: [
    "What's the biggest challenge you're facing right now?",
    "What's a difficult conversation you've been avoiding?",
    "What fear is holding you back?",
    "What would help you feel less overwhelmed?",
    "What's one thing you can control in this situation?",
  ],
  selfCompassion: [
    "What do you need to forgive yourself for?",
    "Write yourself a compassionate letter.",
    "What would you say to comfort yourself right now?",
    "What are three things you like about yourself?",
    "How can you be kinder to yourself today?",
  ],
};

class JournalService {
  /**
   * Create a new journal entry
   */
  async createEntry(entry: Omit<JournalEntry, 'id' | 'timestamp'>): Promise<JournalEntry> {
    try {
      const newEntry: JournalEntry = {
        ...entry,
        id: `journal_${Date.now()}`,
        timestamp: Date.now(),
      };

      const entries = await this.getAllEntries();
      entries.push(newEntry);
      await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));

      // Track for review prompt
      await reviewPrompt.incrementJournalEntries();

      return newEntry;
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
  }

  /**
   * Update an existing journal entry
   */
  async updateEntry(id: string, updates: Partial<JournalEntry>): Promise<void> {
    try {
      const entries = await this.getAllEntries();
      const index = entries.findIndex(e => e.id === id);

      if (index >= 0) {
        entries[index] = { ...entries[index], ...updates };
        await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
      }
    } catch (error) {
      console.error('Error updating journal entry:', error);
      throw error;
    }
  }

  /**
   * Get all journal entries
   */
  async getAllEntries(): Promise<JournalEntry[]> {
    try {
      const data = await AsyncStorage.getItem(JOURNAL_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading journal entries:', error);
      return [];
    }
  }

  /**
   * Get a specific journal entry
   */
  async getEntry(id: string): Promise<JournalEntry | null> {
    try {
      const entries = await this.getAllEntries();
      return entries.find(e => e.id === id) || null;
    } catch (error) {
      console.error('Error loading journal entry:', error);
      return null;
    }
  }

  /**
   * Get recent journal entries
   */
  async getRecentEntries(limit: number = 10): Promise<JournalEntry[]> {
    try {
      const entries = await this.getAllEntries();
      return entries
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    } catch (error) {
      console.error('Error loading recent entries:', error);
      return [];
    }
  }

  /**
   * Get favorite journal entries
   */
  async getFavoriteEntries(): Promise<JournalEntry[]> {
    try {
      const entries = await this.getAllEntries();
      return entries
        .filter(e => e.isFavorite)
        .sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error loading favorite entries:', error);
      return [];
    }
  }

  /**
   * Search journal entries
   */
  async searchEntries(query: string): Promise<JournalEntry[]> {
    try {
      const entries = await this.getAllEntries();
      const lowerQuery = query.toLowerCase();

      return entries.filter(entry => {
        const titleMatch = entry.title?.toLowerCase().includes(lowerQuery);
        const contentMatch = entry.content.toLowerCase().includes(lowerQuery);
        return titleMatch || contentMatch;
      });
    } catch (error) {
      console.error('Error searching journal entries:', error);
      return [];
    }
  }

  /**
   * Delete a journal entry
   */
  async deleteEntry(id: string): Promise<void> {
    try {
      const entries = await this.getAllEntries();
      const filtered = entries.filter(e => e.id !== id);
      await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw error;
    }
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: string): Promise<void> {
    try {
      const entries = await this.getAllEntries();
      const index = entries.findIndex(e => e.id === id);

      if (index >= 0) {
        entries[index].isFavorite = !entries[index].isFavorite;
        await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  /**
   * Get a random journal prompt
   */
  getRandomPrompt(category?: keyof typeof JOURNAL_PROMPTS): string {
    const categories = Object.keys(JOURNAL_PROMPTS) as (keyof typeof JOURNAL_PROMPTS)[];
    const selectedCategory = category || categories[Math.floor(Math.random() * categories.length)];
    const prompts = JOURNAL_PROMPTS[selectedCategory];
    return prompts[Math.floor(Math.random() * prompts.length)];
  }

  /**
   * Get all prompts for a specific category
   */
  getPromptsByCategory(category: keyof typeof JOURNAL_PROMPTS): string[] {
    return JOURNAL_PROMPTS[category];
  }

  /**
   * Get writing streak (consecutive days with entries)
   */
  async getWritingStreak(): Promise<number> {
    try {
      const entries = await this.getAllEntries();
      if (entries.length === 0) return 0;

      // Sort by date descending
      const sorted = entries.sort((a, b) => b.timestamp - a.timestamp);

      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      for (const entry of sorted) {
        const entryDate = new Date(entry.timestamp);
        entryDate.setHours(0, 0, 0, 0);

        const dayDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

        if (dayDiff === 0 || dayDiff === 1) {
          if (dayDiff === 1) {
            currentDate = entryDate;
          }
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error calculating writing streak:', error);
      return 0;
    }
  }

  /**
   * Get total word count across all entries
   */
  async getTotalWordCount(): Promise<number> {
    try {
      const entries = await this.getAllEntries();
      return entries.reduce((total, entry) => {
        const words = entry.content.trim().split(/\s+/).length;
        return total + words;
      }, 0);
    } catch (error) {
      console.error('Error calculating word count:', error);
      return 0;
    }
  }

  /**
   * Clear all journal entries
   */
  async clearAllEntries(): Promise<void> {
    try {
      await AsyncStorage.removeItem(JOURNAL_KEY);
    } catch (error) {
      console.error('Error clearing journal entries:', error);
      throw error;
    }
  }
}

export const journalService = new JournalService();
