// AI Therapist Service - Trauma-Focused Conversational AI
// Uses OpenRouter API for trauma-informed therapeutic guidance

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TherapyMessage {
  id: string;
  role: 'user' | 'therapist';
  content: string;
  timestamp: number;
  emotionalTone?: 'crisis' | 'distressed' | 'anxious' | 'neutral' | 'positive';
  sessionId: string;
}

export interface TherapySession {
  id: string;
  startTime: number;
  endTime?: number;
  messages: TherapyMessage[];
  sessionNotes: string;
  recommendations: string[];
  crisisDetected: boolean;
  traumaIntensity: number; // 0-10
  sessionType: 'general' | 'emdr-prep' | 'grounding' | 'processing' | 'integration';
}

export interface AITherapistConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

const DEFAULT_CONFIG: AITherapistConfig = {
  model: 'openai/gpt-4-turbo',
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: `You are a trauma-informed AI therapist specializing in PTSD, complex trauma, and trauma-related disorders. Your role is to provide evidence-based support using approaches like EMDR, Trauma-Focused CBT, and somatic experiencing.

CRITICAL SAFETY GUIDELINES:
1. ALWAYS prioritize user safety - if crisis indicators are detected, immediately provide crisis resources
2. NEVER attempt to replace professional therapy - encourage professional help
3. NEVER diagnose conditions - use descriptive language instead
4. ALWAYS validate emotions and experiences
5. ALWAYS maintain trauma-informed approach - avoid re-traumatization

THERAPEUTIC APPROACH:
- Use compassionate, validating language
- Normalize trauma responses
- Teach grounding and coping skills
- Support gradual processing of trauma
- Celebrate progress and resilience
- Provide psychoeducation about trauma

CRISIS INDICATORS TO MONITOR:
- Suicidal ideation or self-harm mentions
- Severe dissociation or flashbacks
- Acute panic or hyperventilation
- Substance abuse references
- Domestic violence or abuse situations
- Child abuse or exploitation

When crisis detected: Immediately provide crisis resources and encourage emergency services.`,
};

export const AITherapistService = {
  // Initialize AI therapist
  async initialize(): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem('ai_therapist_initialized');
      if (!existing) {
        await AsyncStorage.setItem('ai_therapist_initialized', 'true');
        await AsyncStorage.setItem(
          'ai_therapist_config',
          JSON.stringify(DEFAULT_CONFIG)
        );
      }
    } catch (error) {
      console.error('Error initializing AI therapist:', error);
    }
  },

  // Get AI therapist config
  async getConfig(): Promise<AITherapistConfig> {
    try {
      const config = await AsyncStorage.getItem('ai_therapist_config');
      return config ? JSON.parse(config) : DEFAULT_CONFIG;
    } catch (error) {
      console.error('Error getting AI therapist config:', error);
      return DEFAULT_CONFIG;
    }
  },

  // Create new therapy session
  async createSession(sessionType: string = 'general'): Promise<TherapySession> {
    const session: TherapySession = {
      id: `session_${Date.now()}`,
      startTime: Date.now(),
      messages: [],
      sessionNotes: '',
      recommendations: [],
      crisisDetected: false,
      traumaIntensity: 5,
      sessionType: sessionType as any,
    };

    try {
      await AsyncStorage.setItem(
        `therapy_session_${session.id}`,
        JSON.stringify(session)
      );
    } catch (error) {
      console.error('Error creating session:', error);
    }

    return session;
  },

  // Get session by ID
  async getSession(sessionId: string): Promise<TherapySession | null> {
    try {
      const session = await AsyncStorage.getItem(`therapy_session_${sessionId}`);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  // Save session
  async saveSession(session: TherapySession): Promise<void> {
    try {
      session.endTime = Date.now();
      await AsyncStorage.setItem(
        `therapy_session_${session.id}`,
        JSON.stringify(session)
      );
    } catch (error) {
      console.error('Error saving session:', error);
    }
  },

  // Get all sessions
  async getAllSessions(): Promise<TherapySession[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const sessionKeys = allKeys.filter(key => key.startsWith('therapy_session_'));

      const sessions: TherapySession[] = [];
      for (const key of sessionKeys) {
        const session = await AsyncStorage.getItem(key);
        if (session) {
          sessions.push(JSON.parse(session));
        }
      }

      return sessions.sort((a, b) => b.startTime - a.startTime);
    } catch (error) {
      console.error('Error getting all sessions:', error);
      return [];
    }
  },

  // Send message to AI therapist
  async sendMessage(
    session: TherapySession,
    userMessage: string
  ): Promise<{ response: string; crisisDetected: boolean; recommendations: string[] }> {
    try {
      // Add user message to session
      const userMsg: TherapyMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: userMessage,
        timestamp: Date.now(),
        sessionId: session.id,
        emotionalTone: detectEmotionalTone(userMessage),
      };

      session.messages.push(userMsg);

      // Check for crisis indicators
      const crisisDetected = checkCrisisIndicators(userMessage);
      if (crisisDetected) {
        session.crisisDetected = true;
      }

      // Get AI response
      const config = await this.getConfig();
      const apiKey = await AsyncStorage.getItem('OPENROUTER_API_KEY');

      if (!apiKey) {
        return {
          response:
            'I notice the AI therapist is not configured. Please add your OpenRouter API key in settings.',
          crisisDetected,
          recommendations: [],
        };
      }

      // Build conversation history for context
      const conversationHistory = session.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call OpenRouter API
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://traumaheal.app',
          'X-Title': 'TraumaHeal',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: config.systemPrompt,
            },
            ...conversationHistory,
          ],
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'API error');
      }

      const aiResponse = data.choices[0]?.message?.content || '';

      // Add therapist message to session
      const therapistMsg: TherapyMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'therapist',
        content: aiResponse,
        timestamp: Date.now(),
        sessionId: session.id,
      };

      session.messages.push(therapistMsg);

      // Generate recommendations based on conversation
      const recommendations = generateRecommendations(userMessage, aiResponse);
      session.recommendations = recommendations;

      // Save session
      await this.saveSession(session);

      return {
        response: aiResponse,
        crisisDetected,
        recommendations,
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        response:
          'I encountered an error processing your message. Please try again or contact support.',
        crisisDetected: false,
        recommendations: [],
      };
    }
  },

  // Generate session summary and notes
  async generateSessionSummary(session: TherapySession): Promise<string> {
    try {
      const config = await this.getConfig();
      const apiKey = await AsyncStorage.getItem('OPENROUTER_API_KEY');

      if (!apiKey) {
        return 'Session summary not available.';
      }

      const conversationText = session.messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n\n');

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://traumaheal.app',
          'X-Title': 'TraumaHeal',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system',
              content:
                'You are a trauma-informed therapist. Summarize this therapy session in 2-3 sentences, highlighting key insights and progress.',
            },
            {
              role: 'user',
              content: `Please summarize this therapy session:\n\n${conversationText}`,
            },
          ],
          temperature: 0.5,
          max_tokens: 300,
        }),
      });

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Session summary not available.';
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Session summary not available.';
    }
  },

  // Get crisis resources
  getCrisisResources(): {
    title: string;
    phone?: string;
    text?: string;
    website?: string;
  }[] {
    return [
      {
        title: 'National Suicide Prevention Lifeline',
        phone: '988',
        website: 'https://988lifeline.org',
      },
      {
        title: 'Crisis Text Line',
        phone: 'Text HOME to 741741',
        text: '741741',
      },
      {
        title: 'SAMHSA National Helpline',
        phone: '1-800-662-4357',
        website: 'https://www.samhsa.gov',
      },
      {
        title: 'International Association for Suicide Prevention',
        website: 'https://www.iasp.info/resources/Crisis_Centres/',
      },
      {
        title: 'Crisis Hotline',
        phone: '1-800-273-8255',
      },
    ];
  },

  // Get therapy techniques based on trauma type
  getTherapyTechniques(traumaType: string): string[] {
    const techniques: Record<string, string[]> = {
      ptsd: [
        'EMDR (Eye Movement Desensitization and Reprocessing)',
        'Trauma-Focused CBT',
        'Prolonged Exposure Therapy',
        'Cognitive Processing Therapy',
      ],
      complex_trauma: [
        'Internal Family Systems (IFS)',
        'Somatic Experiencing',
        'Trauma-Sensitive Yoga',
        'Dialectical Behavior Therapy (DBT)',
      ],
      anxiety: [
        'Grounding Techniques',
        'Progressive Muscle Relaxation',
        'Box Breathing',
        'Mindfulness Meditation',
      ],
      depression: [
        'Behavioral Activation',
        'Thought Records',
        'Gratitude Practice',
        'Social Connection',
      ],
      dissociation: [
        '5-4-3-2-1 Grounding',
        'Bilateral Stimulation',
        'Body Awareness',
        'Sensory Grounding',
      ],
    };

    return techniques[traumaType] || techniques.ptsd;
  },

  // Track session metrics
  async getSessionMetrics(): Promise<{
    totalSessions: number;
    averageSessionLength: number;
    crisisSessionsDetected: number;
    averageTraumaIntensity: number;
  }> {
    try {
      const sessions = await this.getAllSessions();

      const totalSessions = sessions.length;
      const averageSessionLength =
        sessions.length > 0
          ? sessions.reduce((sum, s) => sum + (s.endTime ? s.endTime - s.startTime : 0), 0) /
            sessions.length /
            1000 /
            60
          : 0;
      const crisisSessionsDetected = sessions.filter(s => s.crisisDetected).length;
      const averageTraumaIntensity =
        sessions.length > 0
          ? sessions.reduce((sum, s) => sum + s.traumaIntensity, 0) / sessions.length
          : 0;

      return {
        totalSessions,
        averageSessionLength,
        crisisSessionsDetected,
        averageTraumaIntensity,
      };
    } catch (error) {
      console.error('Error getting session metrics:', error);
      return {
        totalSessions: 0,
        averageSessionLength: 0,
        crisisSessionsDetected: 0,
        averageTraumaIntensity: 0,
      };
    }
  },
};

// Helper functions

function detectEmotionalTone(
  message: string
): 'crisis' | 'distressed' | 'anxious' | 'neutral' | 'positive' {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes('suicide') ||
    lowerMessage.includes('kill') ||
    lowerMessage.includes('harm')
  ) {
    return 'crisis';
  }

  if (
    lowerMessage.includes('panic') ||
    lowerMessage.includes('terrified') ||
    lowerMessage.includes('overwhelmed')
  ) {
    return 'distressed';
  }

  if (
    lowerMessage.includes('worried') ||
    lowerMessage.includes('anxious') ||
    lowerMessage.includes('nervous')
  ) {
    return 'anxious';
  }

  if (
    lowerMessage.includes('good') ||
    lowerMessage.includes('better') ||
    lowerMessage.includes('happy')
  ) {
    return 'positive';
  }

  return 'neutral';
}

function checkCrisisIndicators(message: string): boolean {
  const crisisKeywords = [
    'suicide',
    'suicidal',
    'kill myself',
    'end my life',
    'self harm',
    'cutting',
    'overdose',
    'severe dissociation',
    'flashback',
    'abuse',
    'violence',
  ];

  const lowerMessage = message.toLowerCase();
  return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
}

function generateRecommendations(userMessage: string, aiResponse: string): string[] {
  const recommendations: string[] = [];

  const lowerMessage = (userMessage + ' ' + aiResponse).toLowerCase();

  if (lowerMessage.includes('emdr') || lowerMessage.includes('eye movement')) {
    recommendations.push('Try EMDR Holographic Simulation');
  }

  if (
    lowerMessage.includes('grounding') ||
    lowerMessage.includes('present moment') ||
    lowerMessage.includes('anxiety')
  ) {
    recommendations.push('Practice 5-4-3-2-1 Grounding Exercise');
  }

  if (lowerMessage.includes('breathing') || lowerMessage.includes('calm')) {
    recommendations.push('Try Box Breathing Exercise');
  }

  if (lowerMessage.includes('timeline') || lowerMessage.includes('event')) {
    recommendations.push('Process Trauma Timeline');
  }

  if (lowerMessage.includes('muscle') || lowerMessage.includes('tension')) {
    recommendations.push('Try Progressive Muscle Relaxation');
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue with current therapeutic work');
  }

  return recommendations;
}

export default AITherapistService;
