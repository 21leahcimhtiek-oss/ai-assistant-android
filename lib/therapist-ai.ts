import { OpenRouterService, ChatMessage } from './openrouter';

export interface TherapySession {
  id: string;
  messages: ChatMessage[];
  startTime: number;
  endTime?: number;
  insights: string[];
  mood?: string;
}

export interface TherapistConfig {
  apiKey: string;
  model?: string;
  userName?: string;
}

export class TherapistAI {
  private openRouter: OpenRouterService;
  private config: TherapistConfig;
  
  // CBT-focused system prompt
  private readonly systemPrompt = `You are a compassionate, professional AI therapist specializing in Cognitive Behavioral Therapy (CBT) and general mental health support. Your role is to:

1. **Be Warm & Supportive**: Use empathetic, non-judgmental language. Make the user feel heard and validated.

2. **Apply CBT Techniques**: Help users identify and challenge negative thought patterns, recognize cognitive distortions, and develop healthier thinking habits.

3. **Ask Thoughtful Questions**: Use Socratic questioning to guide users toward insights rather than telling them what to think.

4. **Provide Practical Tools**: Suggest evidence-based coping strategies, breathing exercises, grounding techniques, and behavioral activation.

5. **Assess Risk**: If you detect signs of crisis (suicidal ideation, self-harm, severe distress), gently encourage professional help and crisis resources.

6. **Respect Boundaries**: You are a supportive tool, not a replacement for professional therapy. Encourage users to seek licensed therapists for ongoing care.

7. **Be Concise**: Keep responses clear and digestible. Avoid overwhelming the user with too much information at once.

8. **Track Progress**: Acknowledge improvements and celebrate small wins. Help users recognize patterns in their thoughts and behaviors.

**Common CBT Techniques to Use:**
- Identifying cognitive distortions (all-or-nothing thinking, catastrophizing, etc.)
- Thought records and challenging negative thoughts
- Behavioral activation (scheduling pleasant activities)
- Exposure therapy principles (gradual facing of fears)
- Mindfulness and grounding exercises
- Problem-solving strategies
- Gratitude practices

**Crisis Detection Keywords:**
If the user mentions suicide, self-harm, harming others, or severe distress, respond with immediate support and crisis resources.

Remember: You are here to support, guide, and empower—not to diagnose or replace professional care.`;

  constructor(config: TherapistConfig) {
    this.config = config;
    this.openRouter = new OpenRouterService(config.apiKey);
  }

  /**
   * Start a new therapy session with a greeting
   */
  async startSession(userName?: string): Promise<ChatMessage> {
    const greeting = userName
      ? `Hello ${userName}, I'm here to support you today. How are you feeling?`
      : `Hello, I'm here to support you today. How are you feeling?`;

    return {
      role: 'assistant',
      content: greeting,
    };
  }

  /**
   * Send a message to the therapist and get a response
   */
  async sendMessage(
    messages: ChatMessage[],
    currentMood?: string
  ): Promise<ChatMessage> {
    // Add system prompt and context
    const contextMessages: ChatMessage[] = [
      { role: 'system', content: this.systemPrompt },
    ];

    // Add mood context if available
    if (currentMood) {
      contextMessages.push({
        role: 'system',
        content: `The user's current mood is: ${currentMood}. Be mindful of this in your response.`,
      });
    }

    // Add conversation history
    contextMessages.push(...messages);

    try {
      const response = await this.openRouter.chat({
        model: this.config.model || 'anthropic/claude-3.5-sonnet',
        messages: contextMessages,
      });

      return {
        role: 'assistant',
        content: response,
      };
    } catch (error: any) {
      throw new Error(`Therapist AI error: ${error.message}`);
    }
  }

  /**
   * Detect if the message contains crisis keywords
   */
  detectCrisis(message: string): boolean {
    const crisisKeywords = [
      'suicide',
      'suicidal',
      'kill myself',
      'end my life',
      'want to die',
      'better off dead',
      'self harm',
      'self-harm',
      'cut myself',
      'hurt myself',
      'no reason to live',
    ];

    const lowerMessage = message.toLowerCase();
    return crisisKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  /**
   * Get crisis response message
   */
  getCrisisResponse(): string {
    return `I'm really concerned about what you're sharing. Your safety is the most important thing right now.

If you're in immediate danger, please:
• Call 988 (Suicide & Crisis Lifeline) - Available 24/7
• Text "HELLO" to 741741 (Crisis Text Line)
• Call 911 or go to your nearest emergency room

I'm here to support you, but I want to make sure you have access to immediate professional help. Would you like to talk about what's going on, or would you prefer to reach out to one of these crisis resources first?`;
  }

  /**
   * Generate conversation starters based on common therapy topics
   */
  getConversationStarters(): string[] {
    return [
      "I'm feeling anxious and don't know why",
      "I've been struggling with negative thoughts",
      "I'm having trouble sleeping",
      "I feel overwhelmed by everything",
      "I'm dealing with a difficult relationship",
      "I want to build better habits",
      "I'm feeling stuck and unmotivated",
      "I need help managing stress",
    ];
  }

  /**
   * Extract key insights from a therapy session
   */
  extractInsights(messages: ChatMessage[]): string[] {
    const insights: string[] = [];
    
    // Look for therapist messages that contain actionable advice or key points
    const therapistMessages = messages.filter(m => m.role === 'assistant');
    
    therapistMessages.forEach(message => {
      const content = message.content;
      
      // Extract sentences that contain key therapeutic phrases
      const keyPhrases = [
        'try',
        'practice',
        'remember',
        'notice',
        'consider',
        'it might help',
        'you could',
        'one thing',
      ];
      
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
      
      sentences.forEach(sentence => {
        const lowerSentence = sentence.toLowerCase();
        if (keyPhrases.some(phrase => lowerSentence.includes(phrase))) {
          insights.push(sentence.trim());
        }
      });
    });

    // Return up to 5 most relevant insights
    return insights.slice(0, 5);
  }

  /**
   * Get suggested exercises based on conversation content
   */
  suggestExercises(messages: ChatMessage[]): string[] {
    const allText = messages.map(m => m.content).join(' ').toLowerCase();
    const suggestions: string[] = [];

    if (allText.includes('anxious') || allText.includes('anxiety') || allText.includes('panic')) {
      suggestions.push('breathing', 'grounding');
    }

    if (allText.includes('negative thoughts') || allText.includes('thinking')) {
      suggestions.push('thought-challenging');
    }

    if (allText.includes('stress') || allText.includes('overwhelmed')) {
      suggestions.push('progressive-relaxation', 'breathing');
    }

    if (allText.includes('grateful') || allText.includes('positive')) {
      suggestions.push('gratitude');
    }

    if (allText.includes('sleep') || allText.includes('tired')) {
      suggestions.push('progressive-relaxation');
    }

    return [...new Set(suggestions)]; // Remove duplicates
  }
}
