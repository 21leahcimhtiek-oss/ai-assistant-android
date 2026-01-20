import { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { chatStorage } from '@/lib/chat-storage';
import { AVAILABLE_MODELS } from '@/lib/openrouter';

export default function SettingsScreen() {
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [apiKeySet, setApiKeySet] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await chatStorage.getSettings();
    if (settings) {
      setSelectedModel(settings.selectedModel);
      setApiKeySet(!!settings.apiKey);
    }
  };

  const handleModelSelect = async (modelId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const settings = await chatStorage.getSettings();
    if (settings) {
      settings.selectedModel = modelId;
      await chatStorage.saveSettings(settings);
      setSelectedModel(modelId);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Chat History',
      'This will delete all your conversations. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await chatStorage.clearAllConversations();
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            Alert.alert('Success', 'Chat history cleared');
          },
        },
      ]
    );
  };

  const handleResetApiKey = () => {
    Alert.alert(
      'Reset API Key',
      'You will need to enter your OpenRouter API key again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const settings = await chatStorage.getSettings();
            if (settings) {
              settings.apiKey = '';
              await chatStorage.saveSettings(settings);
              setApiKeySet(false);
              Alert.alert('Success', 'API key reset. Please restart the app.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="px-4 py-3 border-b border-border bg-surface">
        <Text className="text-lg font-bold text-foreground">Settings</Text>
        <Text className="text-xs text-muted mt-1">Configure your AI assistant</Text>
      </View>

      <ScrollView className="flex-1">
        {/* AI Model Selection */}
        <View className="mx-4 mt-4">
          <Text className="text-sm font-semibold text-foreground mb-3">AI Model</Text>
          <View className="gap-2">
            {AVAILABLE_MODELS.map((model) => (
              <TouchableOpacity
                key={model.id}
                onPress={() => handleModelSelect(model.id)}
                className={`p-4 rounded-xl border ${
                  selectedModel === model.id
                    ? 'bg-primary/10 border-primary'
                    : 'bg-surface border-border'
                } active:opacity-80`}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text
                    className={`text-base font-semibold ${
                      selectedModel === model.id ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {model.name}
                  </Text>
                  {selectedModel === model.id && (
                    <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                      <Text className="text-background text-xs">✓</Text>
                    </View>
                  )}
                </View>
                <Text className="text-xs text-muted mb-2">{model.description}</Text>
                <Text className="text-xs text-muted">
                  {model.pricing.prompt} prompt · {model.pricing.completion} completion
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* API Configuration */}
        <View className="mx-4 mt-6">
          <Text className="text-sm font-semibold text-foreground mb-3">API Configuration</Text>
          <View className="bg-surface border border-border rounded-xl p-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm text-foreground">OpenRouter API Key</Text>
              <View className={`px-2 py-1 rounded ${apiKeySet ? 'bg-success/20' : 'bg-error/20'}`}>
                <Text className={`text-xs ${apiKeySet ? 'text-success' : 'text-error'}`}>
                  {apiKeySet ? 'Set' : 'Not Set'}
                </Text>
              </View>
            </View>
            <Text className="text-xs text-muted mb-3">
              Your API key is stored securely on your device
            </Text>
            <TouchableOpacity
              onPress={handleResetApiKey}
              className="bg-error/10 px-4 py-2 rounded-lg active:opacity-80"
            >
              <Text className="text-error font-semibold text-center text-sm">Reset API Key</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Management */}
        <View className="mx-4 mt-6">
          <Text className="text-sm font-semibold text-foreground mb-3">Data Management</Text>
          <TouchableOpacity
            onPress={handleClearHistory}
            className="bg-surface border border-border rounded-xl p-4 active:opacity-80"
          >
            <Text className="text-base font-semibold text-foreground mb-1">Clear Chat History</Text>
            <Text className="text-xs text-muted">Delete all conversations</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View className="mx-4 mt-6 mb-4 p-4 bg-surface border border-border rounded-xl">
          <Text className="text-base font-semibold text-foreground mb-2">About</Text>
          <Text className="text-sm text-muted mb-1">AI Assistant Pro v1.0.0</Text>
          <Text className="text-xs text-muted leading-relaxed">
            Unrestricted AI coding assistant with web scraping, proxy rotation, and Tor network support.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
