// GriefCompanion - Grief Processing Service
// Loss support, memory preservation, and healing journey

export interface GriefEntry {
  id: string;
  userId: number;
  date: Date;
  deceasedName: string;
  griefIntensity: number; // 0-10
  stage: 'denial' | 'anger' | 'bargaining' | 'depression' | 'acceptance';
  memories: string[];
  feelings: string[];
  notes: string;
}

export interface Memory {
  id: string;
  userId: number;
  deceasedName: string;
  date: Date;
  title: string;
  description: string;
  image?: string;
  tags: string[];
}

export interface GriefSupport {
  id: string;
  userId: number;
  deceasedName: string;
  relationshipType: string;
  dateOfLoss: Date;
  coping: string[];
  supportNetwork: string[];
  rituals: string[];
}

export class GriefCompanionService {
  async recordGriefEntry(userId: number, entry: Omit<GriefEntry, 'id' | 'userId'>): Promise<GriefEntry> {
    const griefEntry: GriefEntry = {
      id: `grief_${Date.now()}`,
      userId,
      ...entry,
    };

    // TODO: Save to database
    return griefEntry;
  }

  async getGriefHistory(userId: number, days: number = 90): Promise<GriefEntry[]> {
    // TODO: Query from database
    return [];
  }

  async createMemory(userId: number, memory: Omit<Memory, 'id' | 'userId'>): Promise<Memory> {
    const memoryEntry: Memory = {
      id: `memory_${Date.now()}`,
      userId,
      ...memory,
    };

    // TODO: Save to database
    return memoryEntry;
  }

  async getMemories(userId: number, deceasedName?: string): Promise<Memory[]> {
    // TODO: Query from database
    return [];
  }

  async createGriefSupport(userId: number, support: Omit<GriefSupport, 'id' | 'userId'>): Promise<GriefSupport> {
    const griefSupport: GriefSupport = {
      id: `support_${Date.now()}`,
      userId,
      ...support,
    };

    // TODO: Save to database
    return griefSupport;
  }

  async getGriefStage(userId: number, deceasedName: string): Promise<{ stage: string; description: string; tips: string[] }> {
    const entries = await this.getGriefHistory(userId, 180);
    const relevantEntries = entries.filter(e => e.deceasedName === deceasedName);

    if (relevantEntries.length === 0) {
      return {
        stage: 'Beginning',
        description: 'You are beginning your grief journey',
        tips: [
          'Allow yourself to feel your emotions',
          'Reach out to supportive people',
          'Take care of your basic needs',
          'Consider professional support',
        ],
      };
    }

    const latestEntry = relevantEntries[relevantEntries.length - 1];

    const stageDescriptions: Record<string, { description: string; tips: string[] }> = {
      denial: {
        description: 'You may be experiencing shock or disbelief about the loss',
        tips: [
          'This is a normal protective response',
          'Allow yourself to process at your own pace',
          'Talk about the person and your feelings',
          'Seek support from trusted people',
        ],
      },
      anger: {
        description: 'You may feel frustrated, angry, or resentful',
        tips: [
          'Your anger is valid and normal',
          'Find healthy outlets for your emotions',
          'Exercise or engage in physical activity',
          'Express your feelings through writing or art',
        ],
      },
      bargaining: {
        description: 'You may be reflecting on "what ifs" and trying to negotiate',
        tips: [
          'This is a natural part of processing loss',
          'Focus on what you can control now',
          'Practice self-compassion',
          'Consider creating a meaningful ritual',
        ],
      },
      depression: {
        description: 'You may feel deep sadness and emptiness',
        tips: [
          'This sadness is an expression of your love',
          'Maintain connections with supportive people',
          'Engage in meaningful activities',
          'Consider professional counseling if needed',
        ],
      },
      acceptance: {
        description: 'You are integrating the loss into your life',
        tips: [
          'Remember the person with love',
          'Share stories and memories',
          'Create lasting tributes',
          'Help others who are grieving',
        ],
      },
    };

    return {
      stage: latestEntry.stage,
      description: stageDescriptions[latestEntry.stage]?.description || 'You are on your grief journey',
      tips: stageDescriptions[latestEntry.stage]?.tips || [],
    };
  }

  async getGriefTrends(userId: number, deceasedName: string): Promise<{ average: number; trend: string; progress: number }> {
    const entries = await this.getGriefHistory(userId, 180);
    const relevantEntries = entries.filter(e => e.deceasedName === deceasedName);

    if (relevantEntries.length === 0) {
      return {
        average: 0,
        trend: 'beginning',
        progress: 0,
      };
    }

    const average = relevantEntries.reduce((sum, e) => sum + e.griefIntensity, 0) / relevantEntries.length;

    const firstHalf = relevantEntries
      .slice(0, Math.floor(relevantEntries.length / 2))
      .reduce((sum, e) => sum + e.griefIntensity, 0) / Math.floor(relevantEntries.length / 2);
    const secondHalf = relevantEntries
      .slice(Math.floor(relevantEntries.length / 2))
      .reduce((sum, e) => sum + e.griefIntensity, 0) / (relevantEntries.length - Math.floor(relevantEntries.length / 2));
    const trend = secondHalf < firstHalf - 1 ? 'gradually improving' : secondHalf > firstHalf + 1 ? 'fluctuating' : 'stable';

    const progress = Math.max(0, Math.min(100, 100 - average * 10));

    return {
      average: Math.round(average * 10) / 10,
      trend,
      progress,
    };
  }

  async getGriefResources(): Promise<{ title: string; description: string; type: string }[]> {
    return [
      {
        title: 'Grief Support Groups',
        description: 'Connect with others who understand your loss',
        type: 'community',
      },
      {
        title: 'Grief Counseling',
        description: 'Professional support for processing your grief',
        type: 'professional',
      },
      {
        title: 'Bereavement Hotlines',
        description: 'Talk to trained counselors anytime',
        type: 'hotline',
      },
      {
        title: 'Grief Books',
        description: 'Read about others grief journeys',
        type: 'resource',
      },
      {
        title: 'Memorial Services',
        description: 'Create meaningful tributes',
        type: 'ritual',
      },
    ];
  }
}

export default new GriefCompanionService();
