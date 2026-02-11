// OpenRouter AI Therapist Service
// Real AI-powered conversational therapy with crisis detection

// Use native fetch available in Node 18+

export interface TherapyMessage {
  id: string;
  userId: number;
  appType: string; // traumaheal, mindspace, etc.
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  crisisDetected?: boolean;
  crisisLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface TherapySession {
  id: string;
  userId: number;
  appType: string;
  startTime: Date;
  endTime?: Date;
  messages: TherapyMessage[];
  crisisDetected: boolean;
  notes: string;
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Crisis keywords for detection
const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'hurt myself', 'self harm', 'overdose', 'die', 'death',
  'end it all', 'cannot go on', 'no point', 'hopeless', 'worthless', 'give up',
];

export class OpenRouterTherapistService {
  private systemPrompts: Record<string, string> = {
    traumaheal: `You are a trauma-informed therapist specializing in PTSD and trauma recovery. 
You use evidence-based techniques like EMDR, CPT, and PE. 
Be compassionate, validate feelings, and help the user process trauma safely.
If you detect crisis indicators, respond with empathy and provide crisis resources.`,

    mindspace: `You are a supportive mental health companion specializing in mood support and mental wellness.
Help users understand their emotions, identify patterns, and develop coping strategies.
Use CBT and mindfulness techniques when appropriate.`,

    relationshipai: `You are a relationship counselor specializing in communication and conflict resolution.
Help couples and individuals improve their relationships through better communication.
Use active listening and validation techniques.`,

    anxietycalm: `You are an anxiety specialist using CBT and mindfulness techniques.
Help users understand their anxiety, identify triggers, and develop coping strategies.
Teach breathing and grounding techniques.`,

    moodlift: `You are a depression specialist using behavioral activation and cognitive techniques.
Help users identify activities that improve mood and build motivation.
Encourage small, achievable steps toward recovery.`,

    addictionfree: `You are an addiction recovery specialist using evidence-based relapse prevention.
Support users in their recovery journey with compassion and practical strategies.
Help identify triggers and develop coping mechanisms.`,

    griefcompanion: `You are a grief counselor specializing in loss and bereavement.
Validate the user's grief, help them process loss, and support their healing journey.
Normalize all stages of grief.`,

    childmind: `You are a child and teen mental health specialist.
Use age-appropriate language and techniques. Encourage healthy coping and resilience.
If parent involvement is needed, suggest family-focused approaches.`,

    sleepwell: `You are a sleep specialist using CBT-I and relaxation techniques.
Help users improve sleep quality and manage insomnia.
Provide practical sleep hygiene advice.`,

    stressrelief: `You are a stress management specialist using relaxation and mindfulness techniques.
Help users identify stressors and develop healthy coping strategies.
Teach relaxation techniques and stress reduction methods.`,
  };

  async sendMessage(userId: number, appType: string, userMessage: string, conversationHistory: TherapyMessage[] = []): Promise<TherapyMessage> {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    // Check for crisis indicators
    const crisisDetected = this.detectCrisis(userMessage);

    // Build conversation history for context
    const messages = [
      ...conversationHistory
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({
          role: m.role,
          content: m.content,
        })),
      {
        role: 'user' as const,
        content: userMessage,
      },
    ];

    // Add crisis handling to system prompt if needed
    let systemPrompt = this.systemPrompts[appType] || this.systemPrompts.mindspace;
    if (crisisDetected) {
      systemPrompt += `\n\nIMPORTANT: The user may be in crisis. Respond with empathy and provide crisis resources.
If they mention self-harm or suicide, encourage them to contact:
- National Suicide Prevention Lifeline: 988 (US)
- Crisis Text Line: Text HOME to 741741
- International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/`;
    }

    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://manus.im',
          'X-Title': 'Therapy Apps',
        },
        body: JSON.stringify({
          model: 'openai/gpt-4-turbo',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            ...messages,
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
      }

      const data = (await response.json()) as any;
      const assistantMessage = data.choices[0]?.message?.content || 'I understand. Tell me more about how you are feeling.';

      const therapyMessage: TherapyMessage = {
        id: `msg_${Date.now()}`,
        userId,
        appType,
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date(),
        crisisDetected,
        crisisLevel: this.calculateCrisisLevel(userMessage),
      };

      return therapyMessage;
    } catch (error) {
      console.error('OpenRouter API error:', error);
      // Fallback response
      return {
        id: `msg_${Date.now()}`,
        userId,
        appType,
        role: 'assistant',
        content: 'I appreciate you sharing that with me. Can you tell me more about what you are experiencing?',
        timestamp: new Date(),
        crisisDetected,
        crisisLevel: this.calculateCrisisLevel(userMessage),
      };
    }
  }

  private detectCrisis(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return CRISIS_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
  }

  private calculateCrisisLevel(message: string): 'low' | 'medium' | 'high' | 'critical' {
    const lowerMessage = message.toLowerCase();
    const criticalKeywords = ['suicide', 'kill myself', 'overdose', 'end it all'];
    const highKeywords = ['self harm', 'hurt myself', 'die', 'death', 'cannot go on'];
    const mediumKeywords = ['hopeless', 'worthless', 'give up', 'no point'];

    if (criticalKeywords.some(k => lowerMessage.includes(k))) {
      return 'critical';
    }
    if (highKeywords.some(k => lowerMessage.includes(k))) {
      return 'high';
    }
    if (mediumKeywords.some(k => lowerMessage.includes(k))) {
      return 'medium';
    }
    return 'low';
  }

  async startSession(userId: number, appType: string): Promise<TherapySession> {
    return {
      id: `session_${Date.now()}`,
      userId,
      appType,
      startTime: new Date(),
      messages: [],
      crisisDetected: false,
      notes: '',
    };
  }

  async endSession(session: TherapySession): Promise<TherapySession> {
    return {
      ...session,
      endTime: new Date(),
    };
  }

  async generateSessionSummary(session: TherapySession): Promise<string> {
    if (session.messages.length === 0) {
      return 'No messages in session.';
    }

    const userMessages = session.messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n');

    if (!OPENROUTER_API_KEY) {
      return 'Session summary unavailable.';
    }

    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Summarize this therapy session in 2-3 sentences, highlighting key topics and progress.',
            },
            {
              role: 'user',
              content: userMessages,
            },
          ],
          temperature: 0.5,
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        return 'Session summary unavailable.';
      }

      const data = (await response.json()) as any;
      return data.choices[0]?.message?.content || 'Session completed.';
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Session completed.';
    }
  }
}

export default new OpenRouterTherapistService();
