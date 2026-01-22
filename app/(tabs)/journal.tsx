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
import { journalService, type JournalEntry, JOURNAL_PROMPTS } from '@/lib/journal';

interface JournalPrompt {
  id: string;
  category: string;
  prompt: string;
}

export default function JournalScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [entryContent, setEntryContent] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<JournalPrompt | null>(null);
  const [loading, setLoading] = useState(false);
  const [dailyPrompt, setDailyPrompt] = useState<JournalPrompt | null>(null);

  useEffect(() => {
    loadEntries();
    loadDailyPrompt();
  }, []);

  const loadEntries = async () => {
    try {
      const allEntries = await journalService.getAllEntries();
      setEntries(allEntries.slice(0, 10)); // Show last 10 entries
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const loadDailyPrompt = async () => {
    try {
      // Get a random prompt from all categories
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
        content: entryContent.trim(),
        prompt: selectedPrompt?.prompt,
        isFavorite: false,
      });

      // Reset form
      setEntryContent('');
      setSelectedPrompt(null);
      setShowNewEntry(false);

      // Reload entries
      await loadEntries();

      alert('Journal entry saved!');
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry');
    } finally {
      setLoading(false);
    }
  };

  const usePrompt = (prompt: JournalPrompt) => {
    setSelectedPrompt(prompt);
    setShowNewEntry(true);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Journal</Text>
          <Text className="text-base text-muted">
            Reflect on your thoughts and feelings
          </Text>
        </View>

        {/* Daily Prompt */}
        {dailyPrompt && !showNewEntry && (
          <View className="bg-primary/10 rounded-2xl p-6 mb-4 border border-primary/20">
            <Text className="text-sm font-semibold text-primary mb-2">✨ Daily Prompt</Text>
            <Text className="text-lg text-foreground mb-4">{dailyPrompt.prompt}</Text>
            <TouchableOpacity
              className="bg-primary py-3 rounded-xl items-center"
              onPress={() => usePrompt(dailyPrompt)}
              activeOpacity={0.8}
            >
              <Text className="text-background font-semibold">Write About This</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* New Entry Button */}
        {!showNewEntry && (
          <TouchableOpacity
            className="bg-primary py-4 rounded-xl items-center mb-6"
            onPress={() => setShowNewEntry(true)}
            activeOpacity={0.8}
          >
            <Text className="text-background font-semibold text-lg">+ New Entry</Text>
          </TouchableOpacity>
        )}

        {/* New Entry Form */}
        {showNewEntry && (
          <View className="bg-surface rounded-2xl p-6 mb-6 border border-border">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-foreground">New Entry</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowNewEntry(false);
                  setEntryContent('');
                  setSelectedPrompt(null);
                }}
                activeOpacity={0.7}
              >
                <Text className="text-muted text-lg">✕</Text>
              </TouchableOpacity>
            </View>

            {selectedPrompt && (
              <View className="bg-primary/10 rounded-xl p-3 mb-4">
                <Text className="text-sm text-primary font-semibold mb-1">Prompt:</Text>
                <Text className="text-sm text-foreground">{selectedPrompt.prompt}</Text>
              </View>
            )}

            <TextInput
              className="bg-background border border-border rounded-xl p-4 text-foreground min-h-[200px]"
              placeholder="Start writing..."
              placeholderTextColor="#9BA1A6"
              value={entryContent}
              onChangeText={setEntryContent}
              multiline
              textAlignVertical="top"
            />

            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                className="flex-1 bg-primary py-3 rounded-xl items-center"
                onPress={handleSaveEntry}
                disabled={!entryContent.trim() || loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-background font-semibold">Save Entry</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Recent Entries */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-foreground mb-4">Recent Entries</Text>

          {entries.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-5xl mb-4">📖</Text>
              <Text className="text-lg font-semibold text-foreground mb-2">No entries yet</Text>
              <Text className="text-sm text-muted text-center">
                Start journaling to track your thoughts and progress
              </Text>
            </View>
          ) : (
            entries.map((entry) => (
              <View
                key={entry.id}
                className="bg-surface rounded-2xl p-5 mb-3 border border-border"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-sm font-semibold text-primary">
                    {formatDate(entry.timestamp)}
                  </Text>
                  <Text className="text-xs text-muted">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                {entry.prompt && (
                  <View className="bg-primary/5 rounded-lg p-2 mb-3">
                    <Text className="text-xs text-muted">Prompt: {entry.prompt}</Text>
                  </View>
                )}

                <Text className="text-base text-foreground leading-relaxed" numberOfLines={4}>
                  {entry.content}
                </Text>

                {entry.mood && (
                  <View className="mt-3 pt-3 border-t border-border">
                    <Text className="text-xs text-muted">Mood: {entry.mood}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Browse Prompts */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-foreground mb-4">Browse Prompts</Text>
          
          {Object.entries(JOURNAL_PROMPTS).flatMap(([category, prompts]) => 
            prompts.slice(0, 1).map((prompt, index) => ({
              id: `${category}_${index}`,
              category,
              prompt
            }))
          ).slice(0, 5).map((prompt) => (
            <TouchableOpacity
              key={prompt.id}
              className="bg-surface rounded-xl p-4 mb-3 border border-border"
              onPress={() => usePrompt(prompt)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-start">
                <Text className="text-2xl mr-3">{prompt.category === 'gratitude' ? '🙏' : prompt.category === 'reflection' ? '💭' : prompt.category === 'goals' ? '🎯' : prompt.category === 'emotions' ? '💙' : prompt.category === 'relationships' ? '🤝' : prompt.category === 'growth' ? '🌱' : prompt.category === 'mindfulness' ? '🧘' : '✨'}</Text>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground mb-1">
                    {prompt.prompt}
                  </Text>
                  <Text className="text-xs text-muted capitalize">{prompt.category}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
