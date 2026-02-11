import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { AITherapistService, TherapySession, TherapyMessage } from '../../ai-therapist-service';

export default function AITherapistScreen() {
  const [session, setSession] = useState<TherapySession | null>(null);
  const [messages, setMessages] = useState<TherapyMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      await AITherapistService.initialize();
      const newSession = await AITherapistService.createSession('general');
      setSession(newSession);
      setMessages([]);
    } catch (error) {
      console.error('Error initializing session:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !session || loading) return;

    setLoading(true);
    try {
      const result = await AITherapistService.sendMessage(session, inputText);

      // Update session with new messages
      const updatedSession = await AITherapistService.getSession(session.id);
      if (updatedSession) {
        setSession(updatedSession);
        setMessages(updatedSession.messages);
      }

      setCrisisDetected(result.crisisDetected);
      setRecommendations(result.recommendations);
      setInputText('');

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSession = async () => {
    const newSession = await AITherapistService.createSession('general');
    setSession(newSession);
    setMessages([]);
    setCrisisDetected(false);
    setRecommendations([]);
    setInputText('');
  };

  if (!session) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0 flex-col">
      {/* Header */}
      <View className="bg-primary/10 border-b border-border p-4">
        <Text className="text-2xl font-bold text-foreground">AI Therapist</Text>
        <Text className="text-sm text-muted mt-1">
          Trauma-informed conversational support
        </Text>
      </View>

      {/* Crisis Alert */}
      {crisisDetected && (
        <View className="bg-error/20 border-b border-error p-4">
          <Text className="text-sm font-semibold text-error mb-2">
            ⚠️ Crisis Detected
          </Text>
          <Text className="text-xs text-error mb-3">
            If you're in immediate danger, please contact emergency services or a crisis line.
          </Text>
          <View className="gap-2">
            {AITherapistService.getCrisisResources().map((resource, idx) => (
              <View key={idx} className="bg-background rounded-lg p-2">
                <Text className="text-xs font-semibold text-foreground">
                  {resource.title}
                </Text>
                {resource.phone && (
                  <Text className="text-xs text-muted mt-1">📞 {resource.phone}</Text>
                )}
                {resource.website && (
                  <Text className="text-xs text-primary mt-1">🌐 {resource.website}</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 p-4"
        contentContainerStyle={{ gap: 12 }}
      >
        {messages.length === 0 ? (
          <View className="flex-1 justify-center items-center py-8">
            <Text className="text-center text-muted mb-4">
              Welcome to your AI therapy session. Share what's on your mind, and I'm here to listen
              and support you with trauma-informed guidance.
            </Text>
            <View className="bg-surface rounded-xl p-4 border border-border w-full">
              <Text className="text-sm font-semibold text-foreground mb-2">
                Session Type: {session.sessionType}
              </Text>
              <Text className="text-xs text-muted">
                This is a supportive conversation tool, not a replacement for professional therapy.
              </Text>
            </View>
          </View>
        ) : (
          messages.map(msg => (
            <View
              key={msg.id}
              className={`flex-row ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <View
                className={`max-w-xs rounded-2xl p-4 ${
                  msg.role === 'user'
                    ? 'bg-primary text-background rounded-br-none'
                    : 'bg-surface border border-border rounded-bl-none'
                }`}
              >
                <Text
                  className={`text-sm ${
                    msg.role === 'user' ? 'text-background' : 'text-foreground'
                  }`}
                >
                  {msg.content}
                </Text>
                <Text
                  className={`text-xs mt-1 ${
                    msg.role === 'user' ? 'text-background/70' : 'text-muted'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          ))
        )}

        {loading && (
          <View className="flex-row justify-start">
            <View className="bg-surface border border-border rounded-2xl rounded-bl-none p-4">
              <ActivityIndicator size="small" color="#0a7ea4" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <View className="bg-primary/10 border-t border-border p-4">
          <Text className="text-sm font-semibold text-foreground mb-2">
            Recommended Exercises
          </Text>
          <View className="gap-2">
            {recommendations.map((rec, idx) => (
              <Pressable
                key={idx}
                className="bg-background border border-primary rounded-lg p-3 active:opacity-80"
              >
                <Text className="text-sm font-semibold text-primary">{rec}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Input Area */}
      <View className="border-t border-border p-4 bg-background gap-3">
        <View className="flex-row gap-2">
          <TextInput
            placeholder="Share your thoughts..."
            placeholderTextColor="#687076"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!loading}
            className="flex-1 bg-surface border border-border rounded-xl p-3 text-foreground"
            style={{ maxHeight: 100 }}
          />
          <Pressable
            onPress={handleSendMessage}
            disabled={!inputText.trim() || loading}
            className={`w-12 h-12 rounded-xl justify-center items-center ${
              inputText.trim() && !loading ? 'bg-primary' : 'bg-muted/30'
            } active:opacity-80`}
          >
            <Text className="text-lg">📤</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleNewSession}
          className="bg-surface border border-border rounded-lg p-3 active:opacity-80"
        >
          <Text className="text-center text-sm font-semibold text-foreground">
            Start New Session
          </Text>
        </Pressable>

        <Text className="text-xs text-muted text-center">
          {messages.length} messages • Session started{' '}
          {new Date(session.startTime).toLocaleTimeString()}
        </Text>
      </View>
    </ScreenContainer>
  );
}
