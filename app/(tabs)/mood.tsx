import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { moodTracker, type MoodEntry } from '@/lib/mood-tracker';

type Emotion = 'happy' | 'sad' | 'anxious' | 'angry' | 'calm' | 'excited' | 'stressed' | 'grateful' | 'lonely' | 'confident' | 'overwhelmed' | 'peaceful';

export default function MoodScreen() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedEmotions, setSelectedEmotions] = useState<Emotion[]>([]);
  const [triggers, setTriggers] = useState('');
  const [notes, setNotes] = useState('');
  const [recentEntries, setRecentEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadRecentEntries();
  }, []);

  const loadRecentEntries = async () => {
    try {
      const entries = await moodTracker.getAllMoods();
      setRecentEntries(entries.slice(0, 7)); // Last 7 entries
    } catch (error) {
      console.error('Error loading mood history:', error);
    }
  };

  const handleSaveMood = async () => {
    if (selectedMood === null) return;

    setLoading(true);
    try {
      await moodTracker.logMood({
        moodLevel: selectedMood,
        emotions: selectedEmotions,
        triggers: triggers.trim() ? [triggers.trim()] : undefined,
        notes: notes.trim() || undefined,
      });

      // Reset form
      setSelectedMood(null);
      setSelectedEmotions([]);
      setTriggers('');
      setNotes('');

      // Reload entries
      await loadRecentEntries();

      alert('Mood logged successfully!');
    } catch (error) {
      console.error('Error saving mood:', error);
      alert('Failed to save mood entry');
    } finally {
      setLoading(false);
    }
  };

  const toggleEmotion = (emotion: Emotion) => {
    if (selectedEmotions.includes(emotion)) {
      setSelectedEmotions(selectedEmotions.filter(e => e !== emotion));
    } else {
      setSelectedEmotions([...selectedEmotions, emotion]);
    }
  };

  const getMoodEmoji = (mood: number) => {
    if (mood >= 9) return '😄';
    if (mood >= 7) return '🙂';
    if (mood >= 5) return '😐';
    if (mood >= 3) return '😔';
    return '😢';
  };

  const getMoodLabel = (mood: number) => {
    if (mood >= 9) return 'Excellent';
    if (mood >= 7) return 'Good';
    if (mood >= 5) return 'Okay';
    if (mood >= 3) return 'Low';
    return 'Very Low';
  };

  const emotions: Emotion[] = [
    'happy', 'sad', 'anxious', 'angry', 'calm', 'excited',
    'stressed', 'grateful', 'lonely', 'confident', 'overwhelmed', 'peaceful'
  ];

  const getEmotionEmoji = (emotion: Emotion): string => {
    const emojiMap: Record<Emotion, string> = {
      happy: '😊',
      sad: '😢',
      anxious: '😰',
      angry: '😠',
      calm: '😌',
      excited: '🤩',
      stressed: '😫',
      grateful: '🙏',
      lonely: '😞',
      confident: '💪',
      overwhelmed: '😵',
      peaceful: '☮️',
    };
    return emojiMap[emotion];
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Mood Tracker</Text>
          <Text className="text-base text-muted">
            How are you feeling right now?
          </Text>
        </View>

        {/* Mood Scale */}
        <View className="bg-surface rounded-2xl p-6 mb-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">Rate Your Mood (1-10)</Text>
          
          <View className="flex-row flex-wrap justify-between mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((mood) => (
              <TouchableOpacity
                key={mood}
                className={`w-[18%] aspect-square rounded-full items-center justify-center mb-2 ${
                  selectedMood === mood ? 'bg-primary' : 'bg-surface border-2 border-border'
                }`}
                onPress={() => setSelectedMood(mood)}
                activeOpacity={0.7}
              >
                <Text className={`text-lg font-bold ${selectedMood === mood ? 'text-background' : 'text-foreground'}`}>
                  {mood}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedMood !== null && (
            <View className="items-center py-4 bg-primary/10 rounded-xl">
              <Text className="text-5xl mb-2">{getMoodEmoji(selectedMood)}</Text>
              <Text className="text-xl font-semibold text-foreground">{getMoodLabel(selectedMood)}</Text>
            </View>
          )}
        </View>

        {/* Emotion Wheel */}
        <View className="bg-surface rounded-2xl p-6 mb-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">What emotions are you feeling?</Text>
          
          <View className="flex-row flex-wrap">
            {emotions.map((emotion) => (
              <TouchableOpacity
                key={emotion}
                className={`mr-2 mb-2 px-4 py-2 rounded-full flex-row items-center ${
                  selectedEmotions.includes(emotion) ? 'bg-primary' : 'bg-surface border border-border'
                }`}
                onPress={() => toggleEmotion(emotion)}
                activeOpacity={0.7}
              >
                <Text className="mr-1">{getEmotionEmoji(emotion)}</Text>
                <Text className={`text-sm capitalize ${selectedEmotions.includes(emotion) ? 'text-background' : 'text-foreground'}`}>
                  {emotion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Triggers */}
        <View className="bg-surface rounded-2xl p-6 mb-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-3">Triggers (optional)</Text>
          <TextInput
            className="bg-background border border-border rounded-xl p-3 text-foreground"
            placeholder="What influenced your mood?"
            placeholderTextColor="#9BA1A6"
            value={triggers}
            onChangeText={setTriggers}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Notes */}
        <View className="bg-surface rounded-2xl p-6 mb-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-3">Notes (optional)</Text>
          <TextInput
            className="bg-background border border-border rounded-xl p-3 text-foreground"
            placeholder="Any additional thoughts?"
            placeholderTextColor="#9BA1A6"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className={`py-4 rounded-xl items-center mb-6 ${
            selectedMood === null ? 'bg-muted' : 'bg-primary'
          }`}
          onPress={handleSaveMood}
          disabled={selectedMood === null || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-background font-semibold">Save Mood Entry</Text>
          )}
        </TouchableOpacity>

        {/* Recent Entries */}
        <View className="mb-6">
          <TouchableOpacity
            className="flex-row items-center justify-between mb-3"
            onPress={() => setShowHistory(!showHistory)}
            activeOpacity={0.7}
          >
            <Text className="text-lg font-semibold text-foreground">Recent Entries</Text>
            <Text className="text-muted">{showHistory ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showHistory && recentEntries.length > 0 && (
            <View>
              {recentEntries.map((entry, index) => (
                <View
                  key={index}
                  className="bg-surface rounded-2xl p-4 mb-3 border border-border"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <Text className="text-3xl mr-3">{getMoodEmoji(entry.moodLevel)}</Text>
                      <View>
                      <Text className="text-base font-semibold text-foreground">
                        {getMoodLabel(entry.moodLevel)} ({entry.moodLevel}/10)
                      </Text>
                        <Text className="text-xs text-muted">
                          {new Date(entry.timestamp).toLocaleDateString()} at{' '}
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {entry.emotions.length > 0 && (
                    <View className="flex-row flex-wrap mt-2">
                      {entry.emotions.map((emotion, i) => (
                        <View key={i} className="mr-2 mb-1 px-2 py-1 bg-primary/10 rounded">
                          <Text className="text-xs text-primary capitalize">{emotion}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {entry.notes && (
                    <Text className="text-sm text-muted mt-2">{entry.notes}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {showHistory && recentEntries.length === 0 && (
            <View className="items-center py-8">
              <Text className="text-muted">No mood entries yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
