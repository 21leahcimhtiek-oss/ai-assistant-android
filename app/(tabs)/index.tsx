import { useState, useEffect, useRef } from 'react';
import { ScrollView, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { OpenRouterService, ChatMessage, AVAILABLE_MODELS } from '@/lib/openrouter';
import { chatStorage, ChatConversation } from '@/lib/chat-storage';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ChatScreen() {
  const colors = useColors();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentConversationId] = useState(`conv_${Date.now()}`);

  useEffect(() => {
    loadApiKey();
    loadConversation();
  }, []);

  const loadApiKey = async () => {
    const key = await chatStorage.getApiKey();
    if (key) {
      setApiKey(key);
    } else {
      setShowApiKeyInput(true);
    }
  };

  const loadConversation = async () => {
    const conversations = await chatStorage.getConversations();
    if (conversations.length > 0) {
      const latest = conversations[conversations.length - 1];
      setMessages(latest.messages);
    }
  };

  const saveApiKey = async () => {
    if (OpenRouterService.validateApiKey(tempApiKey)) {
      await chatStorage.saveApiKey(tempApiKey);
      setApiKey(tempApiKey);
      setShowApiKeyInput(false);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      Alert.alert('Invalid API Key', 'Please enter a valid OpenRouter API key (starts with sk-or-)');
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !apiKey) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputText.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const service = new OpenRouterService(apiKey);
      const response = await service.chat({
        model: selectedModel,
        messages: newMessages,
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);

      // Save conversation
      const conversation: ChatConversation = {
        id: currentConversationId,
        title: newMessages[0]?.content.substring(0, 50) || 'New Chat',
        messages: updatedMessages,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await chatStorage.saveConversation(conversation);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to get response from AI');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    setMessages([]);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  if (showApiKeyInput) {
    return (
      <ScreenContainer className="p-6 justify-center">
        <View className="max-w-md self-center w-full gap-4">
          <Text className="text-3xl font-bold text-foreground text-center">Welcome</Text>
          <Text className="text-base text-muted text-center">
            Enter your OpenRouter API key to start using AI Assistant Pro
          </Text>
          
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-sm text-muted mb-2">OpenRouter API Key</Text>
            <TextInput
              className="bg-background text-foreground p-3 rounded-lg border border-border"
              placeholder="sk-or-..."
              placeholderTextColor={colors.muted}
              value={tempApiKey}
              onChangeText={setTempApiKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            onPress={saveApiKey}
            className="bg-primary px-6 py-4 rounded-full active:opacity-80"
          >
            <Text className="text-background font-semibold text-center text-base">Continue</Text>
          </TouchableOpacity>

          <Text className="text-xs text-muted text-center">
            Get your API key from openrouter.ai
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="px-4 py-3 border-b border-border bg-surface">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold text-foreground">AI Assistant</Text>
          <TouchableOpacity
            onPress={clearChat}
            className="px-3 py-1 active:opacity-60"
          >
            <Text className="text-primary text-sm">Clear</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-xs text-muted mt-1">{AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name}</Text>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 16 }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 && (
          <View className="flex-1 items-center justify-center py-12">
            <Text className="text-4xl mb-4">🤖</Text>
            <Text className="text-xl font-bold text-foreground mb-2">AI Assistant Pro</Text>
            <Text className="text-sm text-muted text-center px-8">
              Ask me anything about coding, web scraping, or accessing the deep web
            </Text>
          </View>
        )}

        {messages.map((message, index) => (
          <View
            key={index}
            className={`mb-4 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <View
              className={`max-w-[80%] p-4 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-primary'
                  : 'bg-surface border border-border'
              }`}
            >
              <Text
                className={`text-base leading-relaxed ${
                  message.role === 'user' ? 'text-background' : 'text-foreground'
                }`}
              >
                {message.content}
              </Text>
            </View>
          </View>
        ))}

        {isLoading && (
          <View className="items-start mb-4">
            <View className="bg-surface border border-border p-4 rounded-2xl">
              <ActivityIndicator color={colors.primary} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View className="px-4 py-3 border-t border-border bg-surface">
        <View className="flex-row items-end gap-2">
          <View className="flex-1 bg-background rounded-2xl border border-border px-4 py-2">
            <TextInput
              className="text-foreground text-base max-h-24"
              placeholder="Ask me anything..."
              placeholderTextColor={colors.muted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              returnKeyType="done"
              onSubmitEditing={sendMessage}
              editable={!isLoading}
            />
          </View>
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
            className="bg-primary w-12 h-12 rounded-full items-center justify-center active:opacity-80"
            style={{ opacity: !inputText.trim() || isLoading ? 0.5 : 1 }}
          >
            <IconSymbol name="paperplane.fill" size={20} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
