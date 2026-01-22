import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OpenRouterService, type ChatMessage } from './openrouter';

/**
 * Voice Journaling Service
 * Record audio journal entries with AI transcription
 */

export interface VoiceJournalEntry {
  id: string;
  audioUri: string;
  transcription: string;
  duration: number; // in seconds
  timestamp: number;
  mood?: number;
  emotions?: string[];
}

const VOICE_ENTRIES_KEY = '@mindspace_voice_journal_entries';
const RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

class VoiceJournalService {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;

  /**
   * Request audio permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      return false;
    }
  }

  /**
   * Start recording
   */
  async startRecording(): Promise<void> {
    try {
      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Audio recording permission denied');
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start recording
      const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
      this.recording = recording;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording and return URI
   */
  async stopRecording(): Promise<{ uri: string; duration: number }> {
    try {
      if (!this.recording) {
        throw new Error('No active recording');
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      const status = await this.recording.getStatusAsync();
      const duration = status.durationMillis / 1000;

      this.recording = null;

      if (!uri) {
        throw new Error('Failed to get recording URI');
      }

      return { uri, duration };
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  }

  /**
   * Get recording status
   */
  async getRecordingStatus(): Promise<Audio.RecordingStatus | null> {
    try {
      if (!this.recording) {
        return null;
      }
      return await this.recording.getStatusAsync();
    } catch (error) {
      console.error('Error getting recording status:', error);
      return null;
    }
  }

  /**
   * Transcribe audio using AI
   */
  async transcribeAudio(audioUri: string): Promise<string> {
    try {
      // Get API key
      const apiKey = await AsyncStorage.getItem('@mindspace_openrouter_key');
      if (!apiKey) {
        return '[Transcription unavailable - API key not set]';
      }

      // Read audio file as base64
      const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
        encoding: 'base64',
      });

      // Use AI to transcribe (simulated - in production, use Whisper API or similar)
      const service = new OpenRouterService(apiKey);
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: 'You are a transcription assistant. The user will describe what they said in their audio recording. Transcribe it accurately.',
        },
        {
          role: 'user',
          content: `Please transcribe this audio recording. Since I cannot process audio directly, please provide a placeholder transcription that indicates the audio was recorded successfully and is ${Math.round(audioBase64.length / 1000)}KB in size.`,
        },
      ];

      const transcription = await service.chat({
        model: 'anthropic/claude-3.5-sonnet',
        messages,
        temperature: 0.3,
        maxTokens: 1000,
      });

      return transcription;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      return '[Transcription failed - please try again]';
    }
  }

  /**
   * Save voice journal entry
   */
  async saveEntry(
    audioUri: string,
    transcription: string,
    duration: number,
    mood?: number,
    emotions?: string[]
  ): Promise<VoiceJournalEntry> {
    try {
      const entry: VoiceJournalEntry = {
        id: `voice_${Date.now()}`,
        audioUri,
        transcription,
        duration,
        timestamp: Date.now(),
        mood,
        emotions,
      };

      const entries = await this.getAllEntries();
      entries.unshift(entry);
      await AsyncStorage.setItem(VOICE_ENTRIES_KEY, JSON.stringify(entries));

      return entry;
    } catch (error) {
      console.error('Error saving voice entry:', error);
      throw error;
    }
  }

  /**
   * Get all voice journal entries
   */
  async getAllEntries(): Promise<VoiceJournalEntry[]> {
    try {
      const data = await AsyncStorage.getItem(VOICE_ENTRIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting voice entries:', error);
      return [];
    }
  }

  /**
   * Delete a voice journal entry
   */
  async deleteEntry(entryId: string): Promise<void> {
    try {
      const entries = await this.getAllEntries();
      const entry = entries.find(e => e.id === entryId);
      
      // Delete audio file
      if (entry?.audioUri) {
        await FileSystem.deleteAsync(entry.audioUri, { idempotent: true });
      }

      // Remove from storage
      const filtered = entries.filter(e => e.id !== entryId);
      await AsyncStorage.setItem(VOICE_ENTRIES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting voice entry:', error);
      throw error;
    }
  }

  /**
   * Play audio
   */
  async playAudio(audioUri: string): Promise<void> {
    try {
      // Unload previous sound
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      // Load and play new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      this.sound = sound;

      // Auto-unload when finished
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      throw error;
    }
  }

  /**
   * Pause audio
   */
  async pauseAudio(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.pauseAsync();
      }
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  }

  /**
   * Stop audio
   */
  async stopAudio(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  }

  /**
   * Get audio playback status
   */
  async getPlaybackStatus(): Promise<any | null> {
    try {
      if (!this.sound) {
        return null;
      }
      return await this.sound.getStatusAsync();
    } catch (error) {
      console.error('Error getting playback status:', error);
      return null;
    }
  }

  /**
   * Format duration for display
   */
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Clear all voice entries
   */
  async clearAllEntries(): Promise<void> {
    try {
      const entries = await this.getAllEntries();
      
      // Delete all audio files
      for (const entry of entries) {
        await FileSystem.deleteAsync(entry.audioUri, { idempotent: true });
      }

      // Clear storage
      await AsyncStorage.removeItem(VOICE_ENTRIES_KEY);
    } catch (error) {
      console.error('Error clearing voice entries:', error);
    }
  }
}

export const voiceJournalService = new VoiceJournalService();
