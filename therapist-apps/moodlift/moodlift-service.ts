// MoodLift - Depression Support Service
// Behavioral activation, mood tracking, and recovery support

export interface ActivityEntry {
  id: string;
  userId: number;
  date: Date;
  activity: string;
  duration: number; // minutes
  moodBefore: number; // 0-10
  moodAfter: number; // 0-10
  energyBefore: number; // 0-10
  energyAfter: number; // 0-10
  notes: string;
}

export interface BehavioralActivationPlan {
  id: string;
  userId: number;
  activities: string[];
  schedule: { day: string; activities: string[] }[];
  goals: string[];
  progress: number; // 0-100
}

export interface DepressionEntry {
  id: string;
  userId: number;
  date: Date;
  depressionLevel: number; // 0-10
  sleep: number; // hours
  appetite: string; // 'decreased' | 'normal' | 'increased'
  motivation: number; // 0-10
  socialConnection: number; // 0-10
  notes: string;
}

export class MoodLiftService {
  async recordActivity(userId: number, entry: Omit<ActivityEntry, 'id' | 'userId'>): Promise<ActivityEntry> {
    const activityEntry: ActivityEntry = {
      id: `activity_${Date.now()}`,
      userId,
      ...entry,
    };

    // TODO: Save to database
    return activityEntry;
  }

  async recordDepressionEntry(userId: number, entry: Omit<DepressionEntry, 'id' | 'userId'>): Promise<DepressionEntry> {
    const depressionEntry: DepressionEntry = {
      id: `depression_${Date.now()}`,
      userId,
      ...entry,
    };

    // TODO: Save to database
    return depressionEntry;
  }

  async getActivityHistory(userId: number, days: number = 30): Promise<ActivityEntry[]> {
    // TODO: Query from database
    return [];
  }

  async getDepressionHistory(userId: number, days: number = 30): Promise<DepressionEntry[]> {
    // TODO: Query from database
    return [];
  }

  async createBehavioralActivationPlan(userId: number, activities: string[]): Promise<BehavioralActivationPlan> {
    const plan: BehavioralActivationPlan = {
      id: `plan_${Date.now()}`,
      userId,
      activities,
      schedule: [
        { day: 'Monday', activities: activities.slice(0, 2) },
        { day: 'Tuesday', activities: activities.slice(1, 3) },
        { day: 'Wednesday', activities: activities.slice(2, 4) },
        { day: 'Thursday', activities: activities.slice(0, 2) },
        { day: 'Friday', activities: activities.slice(1, 3) },
        { day: 'Saturday', activities: activities.slice(2, 4) },
        { day: 'Sunday', activities: activities.slice(0, 2) },
      ],
      goals: [
        'Complete at least one activity daily',
        'Increase mood by 2 points this week',
        'Improve sleep quality',
        'Connect with one person daily',
      ],
      progress: 0,
    };

    // TODO: Save to database
    return plan;
  }

  async getActivityImpact(userId: number): Promise<{ activities: string[]; moodImprovement: number[]; energyImprovement: number[] }> {
    const entries = await this.getActivityHistory(userId, 30);

    if (entries.length === 0) {
      return {
        activities: [],
        moodImprovement: [],
        energyImprovement: [],
      };
    }

    const activityMap = new Map<string, { moodDiff: number[]; energyDiff: number[] }>();

    entries.forEach(entry => {
      if (!activityMap.has(entry.activity)) {
        activityMap.set(entry.activity, { moodDiff: [], energyDiff: [] });
      }
      const data = activityMap.get(entry.activity)!;
      data.moodDiff.push(entry.moodAfter - entry.moodBefore);
      data.energyDiff.push(entry.energyAfter - entry.energyBefore);
    });

    const activities: string[] = [];
    const moodImprovement: number[] = [];
    const energyImprovement: number[] = [];

    activityMap.forEach((data, activity) => {
      const avgMoodDiff = data.moodDiff.reduce((a, b) => a + b, 0) / data.moodDiff.length;
      const avgEnergyDiff = data.energyDiff.reduce((a, b) => a + b, 0) / data.energyDiff.length;

      activities.push(activity);
      moodImprovement.push(Math.round(avgMoodDiff * 10) / 10);
      energyImprovement.push(Math.round(avgEnergyDiff * 10) / 10);
    });

    return { activities, moodImprovement, energyImprovement };
  }

  async getDepressionTrends(userId: number): Promise<{ average: number; trend: string; recommendations: string[] }> {
    const entries = await this.getDepressionHistory(userId, 30);

    if (entries.length === 0) {
      return {
        average: 0,
        trend: 'no data',
        recommendations: ['Start tracking your depression symptoms daily', 'Engage in one enjoyable activity today', 'Reach out to someone you trust'],
      };
    }

    const average = entries.reduce((sum, e) => sum + e.depressionLevel, 0) / entries.length;

    const firstHalf = entries.slice(0, Math.floor(entries.length / 2)).reduce((sum, e) => sum + e.depressionLevel, 0) / Math.floor(entries.length / 2);
    const secondHalf = entries.slice(Math.floor(entries.length / 2)).reduce((sum, e) => sum + e.depressionLevel, 0) / (entries.length - Math.floor(entries.length / 2));
    const trend = secondHalf < firstHalf - 1 ? 'improving' : secondHalf > firstHalf + 1 ? 'worsening' : 'stable';

    return {
      average: Math.round(average * 10) / 10,
      trend,
      recommendations: [
        'Engage in behavioral activation - do one enjoyable activity daily',
        'Maintain a consistent sleep schedule',
        'Get outside for 15 minutes of sunlight',
        'Connect with someone you care about',
        'Consider professional help if symptoms persist',
      ],
    };
  }

  async getSuggestedActivities(): Promise<string[]> {
    return [
      'Go for a walk',
      'Call a friend',
      'Exercise or stretch',
      'Read a book',
      'Listen to music',
      'Cook a meal',
      'Take a warm bath',
      'Practice meditation',
      'Write in a journal',
      'Spend time in nature',
      'Watch a favorite movie',
      'Do a creative activity',
      'Volunteer or help someone',
      'Practice a hobby',
      'Spend time with a pet',
    ];
  }
}

export default new MoodLiftService();
