import AsyncStorage from '@react-native-async-storage/async-storage';
import { TherapySession } from './therapist-ai';

const SESSIONS_KEY = '@mindspace_therapy_sessions';
const SETTINGS_KEY = '@mindspace_settings';

export interface AppSettings {
  apiKey: string;
  selectedModel: string;
  userName?: string;
  notificationsEnabled: boolean;
  dailyReminderTime?: string;
}

class TherapyStorageService {
  /**
   * Save a therapy session
   */
  async saveSession(session: TherapySession): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.push(session);
      }
      
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  }

  /**
   * Get all therapy sessions
   */
  async getAllSessions(): Promise<TherapySession[]> {
    try {
      const data = await AsyncStorage.getItem(SESSIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  }

  /**
   * Get a specific session by ID
   */
  async getSession(id: string): Promise<TherapySession | null> {
    try {
      const sessions = await this.getAllSessions();
      return sessions.find(s => s.id === id) || null;
    } catch (error) {
      console.error('Error loading session:', error);
      return null;
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(id: string): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      const filtered = sessions.filter(s => s.id !== id);
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  /**
   * Clear all sessions
   */
  async clearAllSessions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SESSIONS_KEY);
    } catch (error) {
      console.error('Error clearing sessions:', error);
      throw error;
    }
  }

  /**
   * Get app settings
   */
  async getSettings(): Promise<AppSettings | null> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading settings:', error);
      return null;
    }
  }

  /**
   * Save app settings
   */
  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  /**
   * Get API key
   */
  async getApiKey(): Promise<string | null> {
    try {
      const settings = await this.getSettings();
      return settings?.apiKey || null;
    } catch (error) {
      console.error('Error loading API key:', error);
      return null;
    }
  }

  /**
   * Save API key
   */
  async saveApiKey(apiKey: string): Promise<void> {
    try {
      const settings = await this.getSettings() || {
        apiKey: '',
        selectedModel: 'anthropic/claude-3.5-sonnet',
        notificationsEnabled: true,
      };
      settings.apiKey = apiKey;
      await this.saveSettings(settings);
    } catch (error) {
      console.error('Error saving API key:', error);
      throw error;
    }
  }

  /**
   * Get recent sessions (last 10)
   */
  async getRecentSessions(limit: number = 10): Promise<TherapySession[]> {
    try {
      const sessions = await this.getAllSessions();
      return sessions
        .sort((a, b) => b.startTime - a.startTime)
        .slice(0, limit);
    } catch (error) {
      console.error('Error loading recent sessions:', error);
      return [];
    }
  }

  /**
   * Get total session count
   */
  async getSessionCount(): Promise<number> {
    try {
      const sessions = await this.getAllSessions();
      return sessions.length;
    } catch (error) {
      console.error('Error counting sessions:', error);
      return 0;
    }
  }
}

export const therapyStorage = new TherapyStorageService();
