// AddictionFree - Addiction Recovery Service
// Relapse prevention, sobriety tracking, and support

export interface SobrietyEntry {
  id: string;
  userId: number;
  date: Date;
  substanceType: string;
  daysSober: number;
  cravingLevel: number; // 0-10
  copingStrategies: string[];
  support: string; // 'alone' | 'friend' | 'family' | 'group' | 'professional'
  notes: string;
}

export interface RelapsePrevention {
  id: string;
  userId: number;
  triggers: string[];
  warningSignals: string[];
  copingStrategies: string[];
  supportNetwork: { name: string; contact: string }[];
  emergencyPlan: string;
}

export interface RecoveryMilestone {
  id: string;
  userId: number;
  daysSober: number;
  achievedDate: Date;
  milestone: string; // '1 day' | '1 week' | '1 month' | '3 months' | '6 months' | '1 year'
}

export class AddictionFreeService {
  async recordSobrietyEntry(userId: number, entry: Omit<SobrietyEntry, 'id' | 'userId'>): Promise<SobrietyEntry> {
    const sobrietyEntry: SobrietyEntry = {
      id: `sobriety_${Date.now()}`,
      userId,
      ...entry,
    };

    // TODO: Save to database
    return sobrietyEntry;
  }

  async getSobrietyHistory(userId: number, days: number = 365): Promise<SobrietyEntry[]> {
    // TODO: Query from database
    return [];
  }

  async createRelapsePrevention(userId: number, data: Omit<RelapsePrevention, 'id' | 'userId'>): Promise<RelapsePrevention> {
    const plan: RelapsePrevention = {
      id: `prevention_${Date.now()}`,
      userId,
      ...data,
    };

    // TODO: Save to database
    return plan;
  }

  async getRelapsePrevention(userId: number): Promise<RelapsePrevention | null> {
    // TODO: Query from database
    return null;
  }

  async getCurrentStreak(userId: number): Promise<{ daysSober: number; milestone: string; nextMilestone: string; progress: number }> {
    const entries = await this.getSobrietyHistory(userId, 365);

    if (entries.length === 0) {
      return {
        daysSober: 0,
        milestone: 'Starting your recovery journey',
        nextMilestone: '1 day sober',
        progress: 0,
      };
    }

    const sortedEntries = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestEntry = sortedEntries[0];
    const daysSober = latestEntry.daysSober;

    let milestone = 'Starting recovery';
    let nextMilestone = '1 day sober';
    let progress = daysSober % 1;

    if (daysSober >= 365) {
      milestone = '1 year sober';
      nextMilestone = '2 years sober';
      progress = (daysSober % 365) / 365;
    } else if (daysSober >= 180) {
      milestone = '6 months sober';
      nextMilestone = '1 year sober';
      progress = (daysSober % 180) / 180;
    } else if (daysSober >= 90) {
      milestone = '3 months sober';
      nextMilestone = '6 months sober';
      progress = (daysSober % 90) / 90;
    } else if (daysSober >= 30) {
      milestone = '1 month sober';
      nextMilestone = '3 months sober';
      progress = (daysSober % 30) / 30;
    } else if (daysSober >= 7) {
      milestone = '1 week sober';
      nextMilestone = '1 month sober';
      progress = (daysSober % 7) / 7;
    } else if (daysSober >= 1) {
      milestone = '1 day sober';
      nextMilestone = '1 week sober';
      progress = daysSober;
    }

    return {
      daysSober,
      milestone,
      nextMilestone,
      progress: Math.min(progress, 1),
    };
  }

  async getCravingTrends(userId: number): Promise<{ average: number; trend: string; triggers: string[] }> {
    const entries = await this.getSobrietyHistory(userId, 30);

    if (entries.length === 0) {
      return {
        average: 0,
        trend: 'no data',
        triggers: [],
      };
    }

    const average = entries.reduce((sum, e) => sum + e.cravingLevel, 0) / entries.length;

    const firstHalf = entries.slice(0, Math.floor(entries.length / 2)).reduce((sum, e) => sum + e.cravingLevel, 0) / Math.floor(entries.length / 2);
    const secondHalf = entries.slice(Math.floor(entries.length / 2)).reduce((sum, e) => sum + e.cravingLevel, 0) / (entries.length - Math.floor(entries.length / 2));
    const trend = secondHalf < firstHalf - 1 ? 'improving' : secondHalf > firstHalf + 1 ? 'worsening' : 'stable';

    const triggerMap = new Map<string, number>();
    entries.forEach(entry => {
      entry.copingStrategies.forEach(strategy => triggerMap.set(strategy, (triggerMap.get(strategy) || 0) + 1));
    });

    const triggers = Array.from(triggerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([trigger]) => trigger);

    return {
      average: Math.round(average * 10) / 10,
      trend,
      triggers,
    };
  }

  async getRecoverySupportTips(): Promise<string[]> {
    return [
      'Attend support group meetings regularly',
      'Build a strong support network',
      'Identify and avoid your triggers',
      'Develop healthy coping strategies',
      'Maintain a daily routine',
      'Exercise regularly for mental health',
      'Practice mindfulness and meditation',
      'Celebrate your sobriety milestones',
      'Connect with others in recovery',
      'Seek professional help when needed',
      'Keep a recovery journal',
      'Remove temptations from your environment',
      'Find meaningful activities and hobbies',
      'Practice self-compassion and forgiveness',
      'Remember your reasons for recovery',
    ];
  }
}

export default new AddictionFreeService();
