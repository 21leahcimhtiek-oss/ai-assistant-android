// RelationshipAI - Relationship Counseling Service
// Communication tools, conflict resolution, and relationship insights

import { invokeLLM } from '@/server/_core/llm';

export interface RelationshipEntry {
  id: string;
  userId: number;
  date: Date;
  partnerName: string;
  relationshipType: 'romantic' | 'family' | 'friendship' | 'professional';
  satisfaction: number; // 1-10
  communication: number; // 1-10
  conflict: number; // 0-10 (conflict level)
  notes: string;
  issues: string[];
}

export interface CommunicationTip {
  id: string;
  title: string;
  description: string;
  technique: string;
  example: string;
  effectiveness: number; // 0-100
}

export interface ConflictResolution {
  id: string;
  issue: string;
  yourPerspective: string;
  theirPerspective: string;
  commonGround: string[];
  suggestedApproach: string;
  nextSteps: string[];
}

export class RelationshipAIService {
  async recordRelationshipEntry(userId: number, entry: Omit<RelationshipEntry, 'id' | 'userId'>): Promise<RelationshipEntry> {
    const relationshipEntry: RelationshipEntry = {
      id: `rel_${Date.now()}`,
      userId,
      ...entry,
    };

    // TODO: Save to database
    return relationshipEntry;
  }

  async getRelationshipHistory(userId: number, days: number = 30): Promise<RelationshipEntry[]> {
    // TODO: Query from database
    return [];
  }

  async getCommunicationTips(issue: string): Promise<CommunicationTip[]> {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `You are a relationship communication expert. Provide 3 specific communication tips for the following relationship issue. 
          
Return as JSON array with objects containing: title, description, technique, example, effectiveness (0-100).`,
        },
        {
          role: 'user',
          content: `Issue: ${issue}`,
        },
      ],
    });

    try {
      const tipsText = (response as any)?.text || '[]';
      return JSON.parse(tipsText);
    } catch {
      return [
        {
          id: 'tip_1',
          title: 'Active Listening',
          description: 'Focus on understanding your partner without planning your response',
          technique: 'Repeat back what you heard to confirm understanding',
          example: '"So what I hear you saying is..."',
          effectiveness: 85,
        },
        {
          id: 'tip_2',
          title: 'Use "I" Statements',
          description: 'Express your feelings without blaming',
          technique: 'Say "I feel..." instead of "You always..."',
          example: '"I feel hurt when..." instead of "You hurt me"',
          effectiveness: 80,
        },
        {
          id: 'tip_3',
          title: 'Take a Break',
          description: 'Step away if emotions get too high',
          technique: 'Agree to continue the conversation later',
          example: '"Let\'s take 20 minutes and come back to this"',
          effectiveness: 75,
        },
      ];
    }
  }

  async resolveConflict(issue: string, yourPerspective: string, theirPerspective: string): Promise<ConflictResolution> {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `You are a relationship conflict resolution expert. Help resolve this conflict by finding common ground and suggesting an approach.

Return as JSON with: commonGround (array), suggestedApproach (string), nextSteps (array).`,
        },
        {
          role: 'user',
          content: `Issue: ${issue}
Your perspective: ${yourPerspective}
Their perspective: ${theirPerspective}`,
        },
      ],
    });

    try {
      const resolutionText = (response as any)?.text || '{}';
      const data = JSON.parse(resolutionText);
      return {
        id: `conflict_${Date.now()}`,
        issue,
        yourPerspective,
        theirPerspective,
        commonGround: data.commonGround || [],
        suggestedApproach: data.suggestedApproach || 'Focus on understanding each other',
        nextSteps: data.nextSteps || [],
      };
    } catch {
      return {
        id: `conflict_${Date.now()}`,
        issue,
        yourPerspective,
        theirPerspective,
        commonGround: ['You both care about the relationship', 'You want to resolve this'],
        suggestedApproach: 'Have a calm conversation focusing on solutions, not blame',
        nextSteps: ['Listen to their perspective', 'Share your needs clearly', 'Brainstorm solutions together'],
      };
    }
  }

  async getRelationshipInsights(userId: number): Promise<{ satisfaction: number; communication: number; trend: string; recommendations: string[] }> {
    const entries = await this.getRelationshipHistory(userId, 30);

    if (entries.length === 0) {
      return {
        satisfaction: 0,
        communication: 0,
        trend: 'no data',
        recommendations: ['Start tracking your relationship satisfaction', 'Record communication patterns', 'Note any conflicts or positive interactions'],
      };
    }

    const avgSatisfaction = entries.reduce((sum, e) => sum + e.satisfaction, 0) / entries.length;
    const avgCommunication = entries.reduce((sum, e) => sum + e.communication, 0) / entries.length;

    const firstHalf = entries.slice(0, Math.floor(entries.length / 2)).reduce((sum, e) => sum + e.satisfaction, 0) / Math.floor(entries.length / 2);
    const secondHalf = entries.slice(Math.floor(entries.length / 2)).reduce((sum, e) => sum + e.satisfaction, 0) / (entries.length - Math.floor(entries.length / 2));
    const trend = secondHalf > firstHalf + 1 ? 'improving' : secondHalf < firstHalf - 1 ? 'declining' : 'stable';

    return {
      satisfaction: Math.round(avgSatisfaction * 10) / 10,
      communication: Math.round(avgCommunication * 10) / 10,
      trend,
      recommendations: [
        'Schedule regular check-ins with your partner',
        'Practice active listening daily',
        'Express appreciation regularly',
        'Address conflicts promptly',
        'Maintain quality time together',
      ],
    };
  }
}

export default new RelationshipAIService();
