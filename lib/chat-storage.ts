import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from './openrouter';

const CHAT_HISTORY_KEY = '@ai_assistant_chat_history';
const SETTINGS_KEY = '@ai_assistant_settings';

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  selectedModel: string;
  apiKey: string;
  theme: 'light' | 'dark';
  enableHaptics: boolean;
}

export class ChatStorageService {
  async getConversations(): Promise<ChatConversation[]> {
    try {
      const data = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading conversations:', error);
      return [];
    }
  }

  async saveConversation(conversation: ChatConversation): Promise<void> {
    try {
      const conversations = await this.getConversations();
      const index = conversations.findIndex(c => c.id === conversation.id);
      
      if (index >= 0) {
        conversations[index] = conversation;
      } else {
        conversations.push(conversation);
      }
      
      await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw error;
    }
  }

  async deleteConversation(id: string): Promise<void> {
    try {
      const conversations = await this.getConversations();
      const filtered = conversations.filter(c => c.id !== id);
      await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  async clearAllConversations(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing conversations:', error);
      throw error;
    }
  }

  async getSettings(): Promise<AppSettings | null> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading settings:', error);
      return null;
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  async getApiKey(): Promise<string | null> {
    try {
      const settings = await this.getSettings();
      return settings?.apiKey || null;
    } catch (error) {
      console.error('Error getting API key:', error);
      return null;
    }
  }

  async saveApiKey(apiKey: string): Promise<void> {
    try {
      const settings = await this.getSettings() || {
        selectedModel: 'anthropic/claude-3.5-sonnet',
        apiKey: '',
        theme: 'dark',
        enableHaptics: true,
      };
      settings.apiKey = apiKey;
      await this.saveSettings(settings);
    } catch (error) {
      console.error('Error saving API key:', error);
      throw error;
    }
  }
}

export const chatStorage = new ChatStorageService();
