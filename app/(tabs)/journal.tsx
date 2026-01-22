import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { journalService, type JournalEntry, JOURNAL_PROMPTS } from '@/lib/journal';
import { voiceJournalService, type VoiceJournalEntry } from '@/lib/voice-journal';

interface JournalPrompt {
  id: string;
  category: string;
  prompt: string;
}

export default function JournalScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [voiceEntries, setVoiceEntries] = useState<VoiceJournalEntry[]>([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [entryContent, setEntryContent] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<JournalPrompt | null>(null);
  const [loading, setLoading] = useState(false);
  const [dailyPrompt, setDailyPrompt] = useState<JournalPrompt | null>(null);
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
    loadDailyPrompt();
  }, []);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const loadEntries = async () => {
    try {
      const [textEntries, audioEntries] = await Promise.all([
        journalService.getAllEntries(),
        voiceJournalService.getAllEntries(),
      ]);
      setEntries(textEntries.slice(0, 10));
      setVoiceEntries(audioEntries.slice(0, 10));
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const loadDailyPrompt = async () => {
    try {
      const allPrompts = Object.entries(JOURNAL_PROMPTS).flatMap(([category, prompts]) => 
        prompts.map((prompt, index) => ({
          id: `${category}_${index}`,
          category,
          prompt
        }))
      );
      const randomPrompt = allPrompts[Math.floor(Math.random() * allPrompts.length)];
      setDailyPrompt(randomPrompt);
    } catch (error) {
      console.error('Error loading daily prompt:', error);
    }
  };

  const handleSaveEntry = async () => {
    if (!entryContent.trim()) return;

    setLoading(true);
    try {
      await journalService.createEntry({
        content: entryContent,
        prompt: selectedPrompt?.prompt,
        isFavorite: false,
      });
      setEntryContent('');
      setSelectedPrompt(null);
      setShowNewEntry(false);
      await loadEntries();
      Alert.alert('Success', 'Journal entry saved');
    } catch (error) {
      Alert.alert('Error', 'Failed to save entry');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      const hasPermission = await voiceJournalService.requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Please grant microphone permission to record audio');
        return;
      }

      await voiceJournalService.startRecording();
      setIsRecording(true);
      setRecordingDuration(0);
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsRecording(false);
      const { uri, duration } = await voiceJournalService.stopRecording();
      
      // Show transcription loading
      Alert.alert('Processing', 'Transcribing your audio...');
      
      // Transcribe audio
      const transcription = await voiceJournalService.transcribeAudio(uri);
      
      // Save entry
      await voiceJournalService.saveEntry(uri, transcription, duration);
      await loadEntries();
      
      Alert.alert('Success', 'Voice journal entry saved');
    } catch (error) {
      Alert.alert('Error', 'Failed to save voice entry');
    }
  };

  const handlePlayAudio = async (entry: VoiceJournalEntry) => {
    try {
      if (playingAudioId === entry.id) {
        await voiceJournalService.stopAudio();
        setPlayingAudioId(null);
      } else {
        await voiceJournalService.playAudio(entry.audioUri);
        setPlayingAudioId(entry.id);
        
        // Auto-stop after duration
        setTimeout(() => {
          setPlayingAudioId(null);
        }, entry.duration * 1000);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const handleDeleteVoiceEntry = async (entryId: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this voice entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await voiceJournalService.deleteEntry(entryId);
              await loadEntries();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete entry');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Journal</Text>
          <Text className="text-base text-muted">
            Express your thoughts and feelings
          </Text>
        </View>

        {/* Daily Prompt */}
        {dailyPrompt && (
          <TouchableOpacity
            className="bg-primary/10 border border-primary rounded-2xl p-5 mb-6"
            onPress={() => {
              setSelectedPrompt(dailyPrompt);
              setShowNewEntry(true);
            }}
            activeOpacity={0.7}
          >
            <Text className="text-sm text-primary font-semibold mb-2">
              💡 Today's Prompt
            </Text>
            <Text className="text-base text-foreground leading-relaxed">
              {dailyPrompt.prompt}
            </Text>
          </TouchableOpacity>
        )}

        {/* New Entry Buttons */}
        {!showNewEntry && !isRecording && (
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              className="flex-1 bg-primary py-4 rounded-xl items-center"
              onPress={() => setShowNewEntry(true)}
              activeOpacity={0.8}
            >
              <Text className="text-background font-semibold text-base">✍️ Write Entry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-surface border border-primary py-4 rounded-xl items-center"
              onPress={handleStartRecording}
              activeOpacity={0.8}
            >
              <Text className="text-primary font-semibold text-base">🎤 Voice Entry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recording UI */}
        {isRecording && (
          <View className="bg-error/10 border border-error rounded-2xl p-6 mb-6 items-center">
            <View className="w-16 h-16 bg-error rounded-full items-center justify-center mb-4">
              <Text className="text-4xl">🎤</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground mb-2">
              {voiceJournalService.formatDuration(recordingDuration)}
            </Text>
            <Text className="text-sm text-muted mb-4">Recording in progress...</Text>
            <TouchableOpacity
              className="bg-error py-3 px-8 rounded-xl"
              onPress={handleStopRecording}
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold">⏹️ Stop & Save</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* New Entry Form */}
        {showNewEntry && (
          <View className="bg-surface rounded-2xl p-5 border border-border mb-6">
            <Text className="text-lg font-bold text-foreground mb-3">New Entry</Text>
            
            {selectedPrompt && (
              <View className="bg-primary/10 border border-primary rounded-xl p-3 mb-3">
                <Text className="text-xs text-primary font-semibold mb-1">
                  Prompt: {selectedPrompt.category}
                </Text>
                <Text className="text-sm text-foreground">{selectedPrompt.prompt}</Text>
              </View>
            )}

            <TextInput
              className="bg-background border border-border rounded-xl p-4 text-foreground mb-4 min-h-[150px]"
              placeholder="Write your thoughts..."
              placeholderTextColor="#9BA1A6"
              value={entryContent}
              onChangeText={setEntryContent}
              multiline
              textAlignVertical="top"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-primary py-3 rounded-xl items-center"
                onPress={handleSaveEntry}
                disabled={loading || !entryContent.trim()}
                activeOpacity={0.8}
                style={{ opacity: loading || !entryContent.trim() ? 0.5 : 1 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-background font-semibold">Save</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-surface border border-border py-3 px-6 rounded-xl items-center"
                onPress={() => {
                  setShowNewEntry(false);
                  setEntryContent('');
                  setSelectedPrompt(null);
                }}
                activeOpacity={0.8}
              >
                <Text className="text-muted font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Voice Entries */}
        {voiceEntries.length > 0 && (
          <View className="mb-6">
            <Text className="text-xl font-bold text-foreground mb-3">
              🎤 Voice Entries
            </Text>
            {voiceEntries.map((entry) => (
              <View
                key={entry.id}
                className="bg-surface rounded-2xl p-5 border border-border mb-3"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-sm text-muted">
                    {new Date(entry.timestamp).toLocaleDateString()} • {voiceJournalService.formatDuration(entry.duration)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteVoiceEntry(entry.id)}
                    activeOpacity={0.7}
                  >
                    <Text className="text-error text-sm">Delete</Text>
                  </TouchableOpacity>
                </View>

                <View className="bg-background rounded-xl p-4 mb-3">
                  <Text className="text-sm text-foreground leading-relaxed">
                    {entry.transcription}
                  </Text>
                </View>

                <TouchableOpacity
                  className="bg-primary py-3 rounded-xl items-center"
                  onPress={() => handlePlayAudio(entry)}
                  activeOpacity={0.8}
                >
                  <Text className="text-background font-semibold">
                    {playingAudioId === entry.id ? '⏸️ Pause' : '▶️ Play Audio'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Text Entries */}
        {entries.length > 0 && (
          <View className="mb-6">
            <Text className="text-xl font-bold text-foreground mb-3">
              ✍️ Recent Entries
            </Text>
            {entries.map((entry) => (
              <View
                key={entry.id}
                className="bg-surface rounded-2xl p-5 border border-border mb-3"
              >
                <Text className="text-sm text-muted mb-2">
                  {new Date(entry.timestamp).toLocaleDateString()}
                </Text>
                {entry.prompt && (
                  <Text className="text-xs text-primary mb-2">
                    Prompt: {entry.prompt}
                  </Text>
                )}
                <Text className="text-base text-foreground leading-relaxed">
                  {entry.content}
                </Text>
              </View>
            ))}
          </View>
        )}

        {entries.length === 0 && voiceEntries.length === 0 && !showNewEntry && !isRecording && (
          <View className="items-center py-12">
            <Text className="text-6xl mb-4">📔</Text>
            <Text className="text-lg text-muted">No entries yet</Text>
            <Text className="text-sm text-muted mt-2">
              Start journaling to track your thoughts
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
