// SleepWell - Sleep Improvement Service
// Sleep tracking, insomnia treatment, and sleep hygiene

export interface SleepEntry {
  id: string;
  userId: number;
  date: Date;
  bedtime: string;
  wakeTime: string;
  totalSleep: number;
  sleepQuality: number;
  wakeups: number;
  notes: string;
  factors: string[];
}

export interface SleepHygiene {
  id: string;
  userId: number;
  bedtimeRoutine: string[];
  environment: {
    temperature: number;
    darkness: boolean;
    noise: string;
    comfort: string;
  };
  restrictions: {
    screenTime: number;
    caffeine: string;
    alcohol: boolean;
    food: string;
  };
}

export class SleepWellService {
  async recordSleep(userId: number, entry: Omit<SleepEntry, 'id' | 'userId'>): Promise<SleepEntry> {
    const sleepEntry: SleepEntry = {
      id: `sleep_${Date.now()}`,
      userId,
      ...entry,
    };

    // TODO: Save to database
    return sleepEntry;
  }

  async getSleepHistory(userId: number, days: number = 30): Promise<SleepEntry[]> {
    // TODO: Query from database
    return [];
  }

  async getSleepStats(userId: number): Promise<{ average: number; trend: string; consistency: number; quality: number }> {
    const entries = await this.getSleepHistory(userId, 30);

    if (entries.length === 0) {
      return {
        average: 0,
        trend: 'no data',
        consistency: 0,
        quality: 0,
      };
    }

    const average = entries.reduce((sum, e) => sum + e.totalSleep, 0) / entries.length;
    const quality = entries.reduce((sum, e) => sum + e.sleepQuality, 0) / entries.length;

    const firstHalf = entries.slice(0, Math.floor(entries.length / 2)).reduce((sum, e) => sum + e.totalSleep, 0) / Math.floor(entries.length / 2);
    const secondHalf = entries.slice(Math.floor(entries.length / 2)).reduce((sum, e) => sum + e.totalSleep, 0) / (entries.length - Math.floor(entries.length / 2));
    const trend = secondHalf > firstHalf + 0.5 ? 'improving' : secondHalf < firstHalf - 0.5 ? 'declining' : 'stable';

    return {
      average: Math.round(average * 10) / 10,
      trend,
      consistency: 75,
      quality: Math.round(quality),
    };
  }

  async getSleepRecommendations(userId: number): Promise<string[]> {
    return [
      'Try to get 7-9 hours of sleep per night',
      'Maintain a consistent sleep schedule',
      'Keep your bedroom cool, dark, and quiet',
      'Avoid screens 1 hour before bed',
      'Limit caffeine after 2 PM',
      'Exercise regularly but not close to bedtime',
      'Try a relaxation technique if you cannot sleep',
    ];
  }

  async createSleepHygiene(userId: number, hygiene: Omit<SleepHygiene, 'id' | 'userId'>): Promise<SleepHygiene> {
    const sleepHygiene: SleepHygiene = {
      id: `hygiene_${Date.now()}`,
      userId,
      ...hygiene,
    };

    // TODO: Save to database
    return sleepHygiene;
  }

  async getSleepHygiene(userId: number): Promise<SleepHygiene | null> {
    // TODO: Query from database
    return null;
  }
}

export default new SleepWellService();
