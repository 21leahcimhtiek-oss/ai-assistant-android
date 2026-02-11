// AnxietyCalm - Anxiety Management Service
// Breathing exercises, CBT techniques, and anxiety tracking

import { invokeLLM } from '@/server/_core/llm';

export interface AnxietyEntry {
  id: string;
  userId: number;
  date: Date;
  anxietyLevel: number; // 0-10
  triggers: string[];
  symptoms: string[];
  coping: string[];
  duration: number; // minutes
  notes: string;
}

export interface BreathingExercise {
  id: string;
  name: string;
  description: string;
  inhale: number; // seconds
  hold: number; // seconds
  exhale: number; // seconds
  cycles: number;
  effectiveness: number; // 0-100
}

export interface CBTThought {
  id: string;
  situation: string;
  automaticThought: string;
  evidence: string[];
  counterThought: string;
  alternativeThought: string;
}

export const BREATHING_EXERCISES = {
  boxBreathing: {
    id: 'box',
    name: 'Box Breathing',
    description: 'Equal breathing pattern for quick calm',
    inhale: 4,
    hold: 4,
    exhale: 4,
    cycles: 5,
    effectiveness: 85,
  },
  4_7_8: {
    id: '478',
    name: '4-7-8 Breathing',
    description: 'Calming technique for deep relaxation',
    inhale: 4,
    hold: 7,
    exhale: 8,
    cycles: 4,
    effectiveness: 90,
  },
  alternateNostril: {
    id: 'nostril',
    name: 'Alternate Nostril Breathing',
    description: 'Balancing technique for anxiety',
    inhale: 4,
    hold: 4,
    exhale: 4,
    cycles: 5,
    effectiveness: 80,
  },
};

export class AnxietyCalmService {
  async recordAnxietyEntry(userId: number, entry: Omit<AnxietyEntry, 'id' | 'userId'>): Promise<AnxietyEntry> {
    const anxietyEntry: AnxietyEntry = {
      id: `anxiety_${Date.now()}`,
      userId,
      ...entry,
    };

    // TODO: Save to database
    return anxietyEntry;
  }

  async getAnxietyHistory(userId: number, days: number = 30): Promise<AnxietyEntry[]> {
    // TODO: Query from database
    return [];
  }

  async getCBTChallenge(automaticThought: string, situation: string): Promise<CBTThought> {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `You are a CBT (Cognitive Behavioral Therapy) specialist. Help challenge an anxious thought by:
1. Identifying evidence for and against the thought
2. Generating a counter-thought
3. Suggesting an alternative, more balanced thought

Return as JSON with: evidence (array), counterThought (string), alternativeThought (string).`,
        },
        {
          role: 'user',
          content: `Situation: ${situation}
Automatic thought: ${automaticThought}`,
        },
      ],
    });

    try {
      const thoughtText = (response as any)?.text || '{}';
      const data = JSON.parse(thoughtText);
      return {
        id: `cbt_${Date.now()}`,
        situation,
        automaticThought,
        evidence: data.evidence || [],
        counterThought: data.counterThought || 'This thought may not be entirely accurate',
        alternativeThought: data.alternativeThought || 'I can handle this situation',
      };
    } catch {
      return {
        id: `cbt_${Date.now()}`,
        situation,
        automaticThought,
        evidence: ['This is just anxiety talking', 'I have handled similar situations before'],
        counterThought: 'This thought is not based on facts',
        alternativeThought: 'I can manage this. I have coping skills.',
      };
    }
  }

  async getAnxietyTrends(userId: number): Promise<{ average: number; trend: string; triggers: string[]; effectiveCoping: string[] }> {
    const entries = await this.getAnxietyHistory(userId, 30);

    if (entries.length === 0) {
      return {
        average: 0,
        trend: 'no data',
        triggers: [],
        effectiveCoping: [],
      };
    }

    const average = entries.reduce((sum, e) => sum + e.anxietyLevel, 0) / entries.length;

    const firstHalf = entries.slice(0, Math.floor(entries.length / 2)).reduce((sum, e) => sum + e.anxietyLevel, 0) / Math.floor(entries.length / 2);
    const secondHalf = entries.slice(Math.floor(entries.length / 2)).reduce((sum, e) => sum + e.anxietyLevel, 0) / (entries.length - Math.floor(entries.length / 2));
    const trend = secondHalf < firstHalf - 1 ? 'improving' : secondHalf > firstHalf + 1 ? 'worsening' : 'stable';

    const triggerMap = new Map<string, number>();
    const copingMap = new Map<string, number>();

    entries.forEach(entry => {
      entry.triggers.forEach(trigger => triggerMap.set(trigger, (triggerMap.get(trigger) || 0) + 1));
      entry.coping.forEach(strategy => copingMap.set(strategy, (copingMap.get(strategy) || 0) + 1));
    });

    const triggers = Array.from(triggerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([trigger]) => trigger);

    const effectiveCoping = Array.from(copingMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([strategy]) => strategy);

    return {
      average: Math.round(average * 10) / 10,
      trend,
      triggers,
      effectiveCoping,
    };
  }

  async getAnxietyTips(): Promise<string[]> {
    return [
      'Practice breathing exercises daily, even when not anxious',
      'Identify your anxiety triggers and plan coping strategies',
      'Limit caffeine and get regular exercise',
      'Maintain a consistent sleep schedule',
      'Connect with supportive people',
      'Practice mindfulness and grounding techniques',
      'Challenge anxious thoughts with evidence',
      'Take breaks from news and social media',
    ];
  }
}

export default new AnxietyCalmService();
