// MindSpace - AI Mental Health Companion Service
// Mood tracking, journaling, and AI support

import { invokeLLM } from '@/server/_core/llm';

export interface MoodEntry {
  id: string;
  userId: number;
  date: Date;
  moodScore: number; // 1-10
  moodLabel: string; // 'terrible' | 'bad' | 'okay' | 'good' | 'great'
  energy: number; // 1-10
  sleep: number; // 0-10 hours
  activities: string[];
  notes: string;
  triggers: string[];
  coping: string[];
}

export interface JournalEntry {
  id: string;
  userId: number;
  date: Date;
  title: string;
  content: string;
  mood: number; // 1-10
  tags: string[];
  sentiment: 'negative' | 'neutral' | 'positive';
}

export interface MoodPattern {
  period: 'week' | 'month' | 'year';
  averageMood: number;
  trend: 'improving' | 'stable' | 'declining';
  topTriggers: string[];
  topCopingStrategies: string[];
  insights: string[];
}

export class MindSpaceService {
  async recordMood(userId: number, entry: Omit<MoodEntry, 'id' | 'userId'>): Promise<MoodEntry> {
    const moodEntry: MoodEntry = {
      id: `mood_${Date.now()}`,
      userId,
      ...entry,
    };

    // TODO: Save to database
    // await db.recordMood(moodEntry);

    return moodEntry;
  }

  async createJournalEntry(userId: number, entry: Omit<JournalEntry, 'id' | 'userId' | 'sentiment'>): Promise<JournalEntry> {
    // Analyze sentiment using AI
    const sentimentResponse = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Analyze the sentiment of the following journal entry. Respond with only: negative, neutral, or positive',
        },
        {
          role: 'user',
          content: entry.content,
        },
      ],
    });

    const sentiment = ((sentimentResponse as any)?.text || 'neutral').toLowerCase() as 'negative' | 'neutral' | 'positive';

    const journalEntry: JournalEntry = {
      id: `journal_${Date.now()}`,
      userId,
      ...entry,
      sentiment,
    };

    // TODO: Save to database
    // await db.createJournalEntry(journalEntry);

    return journalEntry;
  }

  async getMoodHistory(userId: number, days: number = 30): Promise<MoodEntry[]> {
    // TODO: Query from database
    return [];
  }

  async getJournalEntries(userId: number, limit: number = 20): Promise<JournalEntry[]> {
    // TODO: Query from database
    return [];
  }

  async analyzeMoodPattern(userId: number, period: 'week' | 'month' | 'year' = 'month'): Promise<MoodPattern> {
    const entries = await this.getMoodHistory(userId, period === 'week' ? 7 : period === 'month' ? 30 : 365);

    if (entries.length === 0) {
      return {
        period,
        averageMood: 0,
        trend: 'stable',
        topTriggers: [],
        topCopingStrategies: [],
        insights: [],
      };
    }

    const averageMood = entries.reduce((sum, e) => sum + e.moodScore, 0) / entries.length;

    // Analyze trend
    const firstHalf = entries.slice(0, Math.floor(entries.length / 2)).reduce((sum, e) => sum + e.moodScore, 0) / Math.floor(entries.length / 2);
    const secondHalf = entries.slice(Math.floor(entries.length / 2)).reduce((sum, e) => sum + e.moodScore, 0) / (entries.length - Math.floor(entries.length / 2));
    const trend = secondHalf > firstHalf + 1 ? 'improving' : secondHalf < firstHalf - 1 ? 'declining' : 'stable';

    // Get top triggers and coping strategies
    const triggerMap = new Map<string, number>();
    const copingMap = new Map<string, number>();

    entries.forEach(entry => {
      entry.triggers.forEach(trigger => triggerMap.set(trigger, (triggerMap.get(trigger) || 0) + 1));
      entry.coping.forEach(strategy => copingMap.set(strategy, (copingMap.get(strategy) || 0) + 1));
    });

    const topTriggers = Array.from(triggerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([trigger]) => trigger);

    const topCopingStrategies = Array.from(copingMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([strategy]) => strategy);

    // Generate insights using AI
    const insightResponse = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `You are a mental health insights generator. Analyze the following mood data and provide 3 brief, actionable insights.
          
Average mood: ${averageMood.toFixed(1)}/10
Trend: ${trend}
Top triggers: ${topTriggers.join(', ')}
Top coping strategies: ${topCopingStrategies.join(', ')}

Provide insights in a JSON array format: ["insight1", "insight2", "insight3"]`,
        },
        {
          role: 'user',
          content: 'Generate insights',
        },
      ],
    });

    let insights: string[] = [];
    try {
      const insightText = (insightResponse as any)?.text || '[]';
      insights = JSON.parse(insightText);
    } catch {
      insights = ['Keep tracking your mood to identify patterns', 'Notice what activities improve your mood', 'Practice your most effective coping strategies'];
    }

    return {
      period,
      averageMood: Math.round(averageMood * 10) / 10,
      trend,
      topTriggers,
      topCopingStrategies,
      insights,
    };
  }

  async generateDailyInsight(userId: number): Promise<string> {
    const todayEntry = (await this.getMoodHistory(userId, 1))[0];
    const pattern = await this.analyzeMoodPattern(userId, 'week');

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `You are a supportive mental health companion. Generate a brief, personalized daily insight based on the user's mood data.
          
Today's mood: ${todayEntry?.moodScore || 'not recorded'}/10
Weekly average: ${pattern.averageMood}/10
Weekly trend: ${pattern.trend}

Keep the insight brief (1-2 sentences), supportive, and actionable.`,
        },
        {
          role: 'user',
          content: 'Generate a daily insight',
        },
      ],
    });

    return (response as any)?.text || 'Keep taking care of yourself today.';
  }

  async getMoodRecommendations(userId: number): Promise<string[]> {
    const pattern = await this.analyzeMoodPattern(userId, 'month');

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `You are a mental health recommendation engine. Based on the user's mood patterns, provide 5 personalized recommendations.

Average mood: ${pattern.averageMood}/10
Trend: ${pattern.trend}
Top triggers: ${pattern.topTriggers.join(', ')}
Effective coping: ${pattern.topCopingStrategies.join(', ')}

Provide recommendations as a JSON array: ["rec1", "rec2", "rec3", "rec4", "rec5"]`,
        },
        {
          role: 'user',
          content: 'Generate recommendations',
        },
      ],
    });

    try {
      const recText = (response as any)?.text || '[]';
      return JSON.parse(recText);
    } catch {
      return [
        'Track your mood daily to identify patterns',
        'Practice your most effective coping strategies',
        'Maintain a consistent sleep schedule',
        'Engage in activities that improve your mood',
        'Connect with supportive people',
      ];
    }
  }
}

export default new MindSpaceService();
