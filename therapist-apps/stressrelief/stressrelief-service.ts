// StressRelief - Stress Management Service
// Stress tracking, relaxation techniques, and wellness

export interface StressEntry {
  id: string;
  userId: number;
  date: Date;
  stressLevel: number; // 0-10
  sources: string[];
  physicalSymptoms: string[];
  emotionalSymptoms: string[];
  copingStrategies: string[];
  notes: string;
}

export interface RelaxationSession {
  id: string;
  userId: number;
  type: 'meditation' | 'breathing' | 'yoga' | 'massage' | 'music' | 'nature';
  duration: number; // minutes
  startTime: Date;
  endTime: Date;
  stressBefore: number; // 0-10
  stressAfter: number; // 0-10
  notes: string;
}

export interface WellnessGoal {
  id: string;
  userId: number;
  goal: string;
  category: 'exercise' | 'mindfulness' | 'social' | 'hobby' | 'sleep' | 'nutrition';
  frequency: string; // daily, weekly, etc.
  progress: number; // 0-100
  createdAt: Date;
}

export class StressReliefService {
  async recordStress(userId: number, entry: Omit<StressEntry, 'id' | 'userId'>): Promise<StressEntry> {
    const stressEntry: StressEntry = {
      id: `stress_${Date.now()}`,
      userId,
      ...entry,
    };

    // TODO: Save to database
    return stressEntry;
  }

  async getStressHistory(userId: number, days: number = 30): Promise<StressEntry[]> {
    // TODO: Query from database
    return [];
  }

  async recordRelaxationSession(userId: number, session: Omit<RelaxationSession, 'id' | 'userId'>): Promise<RelaxationSession> {
    const relaxationSession: RelaxationSession = {
      id: `relax_${Date.now()}`,
      userId,
      ...session,
    };

    // TODO: Save to database
    return relaxationSession;
  }

  async getRelaxationHistory(userId: number, days: number = 30): Promise<RelaxationSession[]> {
    // TODO: Query from database
    return [];
  }

  async getStressTrends(userId: number): Promise<{ average: number; trend: string; topSources: string[]; effectiveCoping: string[] }> {
    const entries = await this.getStressHistory(userId, 30);

    if (entries.length === 0) {
      return {
        average: 0,
        trend: 'no data',
        topSources: [],
        effectiveCoping: [],
      };
    }

    const average = entries.reduce((sum, e) => sum + e.stressLevel, 0) / entries.length;

    const firstHalf = entries.slice(0, Math.floor(entries.length / 2)).reduce((sum, e) => sum + e.stressLevel, 0) / Math.floor(entries.length / 2);
    const secondHalf = entries.slice(Math.floor(entries.length / 2)).reduce((sum, e) => sum + e.stressLevel, 0) / (entries.length - Math.floor(entries.length / 2));
    const trend = secondHalf < firstHalf - 1 ? 'improving' : secondHalf > firstHalf + 1 ? 'worsening' : 'stable';

    const sourceMap = new Map<string, number>();
    const copingMap = new Map<string, number>();

    entries.forEach(entry => {
      entry.sources.forEach(source => sourceMap.set(source, (sourceMap.get(source) || 0) + 1));
      entry.copingStrategies.forEach(strategy => copingMap.set(strategy, (copingMap.get(strategy) || 0) + 1));
    });

    const topSources = Array.from(sourceMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([source]) => source);

    const effectiveCoping = Array.from(copingMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([strategy]) => strategy);

    return {
      average: Math.round(average * 10) / 10,
      trend,
      topSources,
      effectiveCoping,
    };
  }

  async getRelaxationEffectiveness(userId: number): Promise<{ type: string; effectiveness: number }[]> {
    const sessions = await this.getRelaxationHistory(userId, 30);

    if (sessions.length === 0) {
      return [];
    }

    const typeMap = new Map<string, { total: number; count: number }>();

    sessions.forEach(session => {
      if (!typeMap.has(session.type)) {
        typeMap.set(session.type, { total: 0, count: 0 });
      }
      const data = typeMap.get(session.type)!;
      data.total += session.stressBefore - session.stressAfter;
      data.count += 1;
    });

    const effectiveness: { type: string; effectiveness: number }[] = [];
    typeMap.forEach((data, type) => {
      effectiveness.push({
        type,
        effectiveness: Math.round((data.total / data.count) * 10),
      });
    });

    return effectiveness.sort((a, b) => b.effectiveness - a.effectiveness);
  }

  async getStressManagementTips(): Promise<string[]> {
    return [
      'Practice daily meditation or mindfulness',
      'Exercise regularly for stress relief',
      'Maintain a consistent sleep schedule',
      'Connect with supportive people',
      'Take breaks throughout the day',
      'Practice deep breathing exercises',
      'Engage in hobbies you enjoy',
      'Limit caffeine and alcohol',
      'Organize and prioritize your tasks',
      'Practice saying no to unnecessary commitments',
      'Spend time in nature',
      'Listen to relaxing music',
      'Try progressive muscle relaxation',
      'Keep a gratitude journal',
      'Seek professional help if needed',
    ];
  }

  async createWellnessGoal(userId: number, goal: Omit<WellnessGoal, 'id' | 'userId' | 'createdAt'>): Promise<WellnessGoal> {
    const wellnessGoal: WellnessGoal = {
      id: `goal_${Date.now()}`,
      userId,
      ...goal,
      createdAt: new Date(),
    };

    // TODO: Save to database
    return wellnessGoal;
  }

  async getWellnessGoals(userId: number): Promise<WellnessGoal[]> {
    // TODO: Query from database
    return [];
  }
}

export default new StressReliefService();
