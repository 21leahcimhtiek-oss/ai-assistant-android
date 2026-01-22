import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { TherapistAI } from '@/lib/therapist-ai';
import { type ChatMessage } from '@/lib/openrouter';
import { therapyStorage } from '@/lib/therapy-storage';

interface DisplayMessage extends ChatMessage {
  id: string;
  timestamp: number;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [therapist] = useState(() => new TherapistAI({ apiKey: process.env.OPENROUTER_API_KEY || '' }));
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const sessions = await therapyStorage.getAllSessions();
      if (sessions.length > 0) {
        const latestSession = sessions[sessions.length - 1];
        setSessionId(latestSession.id);
        const displayMessages: DisplayMessage[] = latestSession.messages.map((msg, index) => ({
          ...msg,
          id: `msg_${latestSession.startTime}_${index}`,
          timestamp: latestSession.startTime + index * 1000,
        }));
        setMessages(displayMessages);
      } else {
        // Create new session
        const newSessionId = `session_${Date.now()}`;
        setSessionId(newSessionId);
        
        // Add welcome message
        const welcomeMessage: DisplayMessage = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: "Hello! I'm here to support you on your mental health journey. How are you feeling today?",
          timestamp: Date.now(),
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage: DisplayMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setLoading(true);

    try {
      // Convert to ChatMessage format for API
      const chatMessages: ChatMessage[] = newMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Get AI response
      const responseMessage = await therapist.sendMessage(chatMessages);
      
      const assistantMessage: DisplayMessage = {
        id: `msg_${Date.now() + 1}`,
        role: responseMessage.role,
        content: responseMessage.content,
        timestamp: Date.now(),
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);

      // Save session
      const sessionMessages: ChatMessage[] = updatedMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      await therapyStorage.saveSession({
        id: sessionId,
        startTime: messages[0]?.timestamp || Date.now(),
        endTime: Date.now(),
        messages: sessionMessages,
        insights: [],
        mood: undefined,
      });

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: DisplayMessage }) => {
    const isUser = item.role === 'user';
    
    return (
      <View
        className={`mb-3 ${isUser ? 'items-end' : 'items-start'}`}
      >
        <View
          className={`max-w-[80%] rounded-2xl p-4 ${
            isUser ? 'bg-primary' : 'bg-surface border border-border'
          }`}
        >
          <Text className={`text-base ${isUser ? 'text-background' : 'text-foreground'}`}>
            {item.content}
          </Text>
          <Text className={`text-xs mt-2 ${isUser ? 'text-background/70' : 'text-muted'}`}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const suggestedPrompts = [
    "I'm feeling anxious today",
    "Help me with negative thoughts",
    "I need coping strategies",
    "Tell me about CBT techniques",
  ];

  return (
    <ScreenContainer className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={100}
      >
        <View className="flex-1 p-4">
          {/* Header */}
          <View className="mb-4">
            <Text className="text-2xl font-bold text-foreground">Therapy Chat</Text>
            <Text className="text-sm text-muted">AI-powered mental health support</Text>
          </View>

          {/* Messages */}
          {messages.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-4xl mb-4">💬</Text>
              <Text className="text-lg font-semibold text-foreground mb-2">Start a conversation</Text>
              <Text className="text-sm text-muted text-center mb-6">
                Share what's on your mind. I'm here to listen and support you.
              </Text>
              
              {/* Suggested Prompts */}
              <View className="w-full">
                <Text className="text-sm font-semibold text-foreground mb-3">Try asking:</Text>
                {suggestedPrompts.map((prompt, index) => (
                  <TouchableOpacity
                    key={index}
                    className="bg-surface border border-border rounded-xl p-3 mb-2"
                    onPress={() => setInputText(prompt)}
                    activeOpacity={0.7}
                  >
                    <Text className="text-sm text-foreground">{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
          )}

          {/* Input Area */}
          <View className="pt-3 border-t border-border">
            <View className="flex-row items-center bg-surface rounded-xl px-4 py-2 border border-border">
              <TextInput
                className="flex-1 text-foreground py-2"
                placeholder="Type your message..."
                placeholderTextColor="#9BA1A6"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={1000}
                editable={!loading}
                returnKeyType="send"
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity
                className="ml-2 bg-primary w-10 h-10 rounded-full items-center justify-center"
                onPress={sendMessage}
                disabled={!inputText.trim() || loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-background text-lg">➤</Text>
                )}
              </TouchableOpacity>
            </View>
            <Text className="text-xs text-muted mt-2 text-center">
              This is an AI assistant. For emergencies, call 988 or 911.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
