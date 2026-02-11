// ChildMind - Mental Health for Children and Teens Service
// Age-appropriate support, parent tools, and youth engagement

export interface ChildMoodEntry {
  id: string;
  childId: number;
  parentId: number;
  date: Date;
  age: number;
  mood: number; // 1-5 (simplified for kids)
  schoolDay: boolean;
  activities: string[];
  socialInteraction: number; // 1-5
  sleep: number; // hours
  notes: string;
}

export interface ParentGuide {
  id: string;
  topic: string;
  ageGroup: string;
  tips: string[];
  resources: string[];
  warningSignals: string[];
}

export interface YouthJournal {
  id: string;
  childId: number;
  date: Date;
  title: string;
  content: string;
  mood: number; // 1-5
  drawing?: string; // base64 image
  tags: string[];
}

export class ChildMindService {
  async recordChildMood(parentId: number, childId: number, entry: Omit<ChildMoodEntry, 'id' | 'childId' | 'parentId'>): Promise<ChildMoodEntry> {
    const moodEntry: ChildMoodEntry = {
      id: `child_mood_${Date.now()}`,
      childId,
      parentId,
      ...entry,
    };

    // TODO: Save to database
    return moodEntry;
  }

  async getChildMoodHistory(childId: number, days: number = 30): Promise<ChildMoodEntry[]> {
    // TODO: Query from database
    return [];
  }

  async createYouthJournal(childId: number, entry: Omit<YouthJournal, 'id' | 'childId'>): Promise<YouthJournal> {
    const journalEntry: YouthJournal = {
      id: `youth_journal_${Date.now()}`,
      childId,
      ...entry,
    };

    // TODO: Save to database
    return journalEntry;
  }

  async getYouthJournals(childId: number): Promise<YouthJournal[]> {
    // TODO: Query from database
    return [];
  }

  async getParentGuide(topic: string, ageGroup: string): Promise<ParentGuide> {
    const guides: Record<string, Record<string, ParentGuide>> = {
      anxiety: {
        'elementary': {
          id: 'guide_1',
          topic: 'Childhood Anxiety',
          ageGroup: 'elementary',
          tips: [
            'Help your child name their feelings',
            'Teach simple breathing exercises',
            'Create a calm-down corner',
            'Validate their feelings without enabling avoidance',
            'Model calm behavior yourself',
          ],
          resources: [
            'Anxiety workbooks for kids',
            'Guided meditation apps for children',
            'School counselor support',
          ],
          warningSignals: [
            'Excessive worry about school or social situations',
            'Physical symptoms like stomachaches',
            'Avoidance of activities',
            'Sleep problems',
          ],
        },
        'teen': {
          id: 'guide_2',
          topic: 'Teen Anxiety',
          ageGroup: 'teen',
          tips: [
            'Listen without judgment',
            'Help them identify triggers',
            'Encourage healthy coping strategies',
            'Maintain open communication',
            'Know when to seek professional help',
          ],
          resources: [
            'Cognitive behavioral therapy resources',
            'Peer support groups',
            'Crisis hotlines for teens',
          ],
          warningSignals: [
            'Persistent worry affecting daily life',
            'Social withdrawal',
            'Academic decline',
            'Substance experimentation',
          ],
        },
      },
      depression: {
        'elementary': {
          id: 'guide_3',
          topic: 'Childhood Depression',
          ageGroup: 'elementary',
          tips: [
            'Notice changes in behavior and mood',
            'Encourage physical activity',
            'Maintain routines',
            'Spend quality time together',
            'Seek professional evaluation if concerned',
          ],
          resources: [
            'Child psychologist',
            'School counselor',
            'Family therapy',
          ],
          warningSignals: [
            'Persistent sadness or irritability',
            'Loss of interest in activities',
            'Changes in sleep or appetite',
            'Difficulty concentrating',
          ],
        },
        'teen': {
          id: 'guide_4',
          topic: 'Teen Depression',
          ageGroup: 'teen',
          tips: [
            'Take their feelings seriously',
            'Encourage professional help',
            'Maintain connection and support',
            'Monitor for warning signs',
            'Create a safety plan if needed',
          ],
          resources: [
            'Mental health counselor',
            'Support groups for teens',
            'Crisis resources',
          ],
          warningSignals: [
            'Persistent sad mood',
            'Withdrawal from friends',
            'Academic problems',
            'Talk of death or suicide',
          ],
        },
      },
    };

    return guides[topic]?.[ageGroup] || {
      id: 'default',
      topic,
      ageGroup,
      tips: ['Seek professional guidance', 'Maintain open communication', 'Provide support and validation'],
      resources: ['Mental health professional', 'School counselor'],
      warningSignals: ['Significant changes in behavior or mood'],
    };
  }

  async getChildWellnessScore(childId: number): Promise<{ overall: number; mood: number; social: number; sleep: number; activity: number }> {
    const entries = await this.getChildMoodHistory(childId, 30);

    if (entries.length === 0) {
      return {
        overall: 0,
        mood: 0,
        social: 0,
        sleep: 0,
        activity: 0,
      };
    }

    const avgMood = (entries.reduce((sum, e) => sum + e.mood, 0) / entries.length) * 20;
    const avgSocial = (entries.reduce((sum, e) => sum + e.socialInteraction, 0) / entries.length) * 20;
    const avgSleep = Math.min(100, (entries.reduce((sum, e) => sum + e.sleep, 0) / entries.length / 9) * 100);
    const avgActivity = (entries.filter(e => e.activities.length > 0).length / entries.length) * 100;

    const overall = (avgMood + avgSocial + avgSleep + avgActivity) / 4;

    return {
      overall: Math.round(overall),
      mood: Math.round(avgMood),
      social: Math.round(avgSocial),
      sleep: Math.round(avgSleep),
      activity: Math.round(avgActivity),
    };
  }

  async getAgeAppropriateActivities(age: number): Promise<string[]> {
    if (age < 6) {
      return ['Play with toys', 'Draw and color', 'Play outside', 'Read stories', 'Sing songs'];
    } else if (age < 12) {
      return ['Sports and games', 'Arts and crafts', 'Reading', 'Building projects', 'Playing with friends', 'Video games', 'Music lessons'];
    } else {
      return ['Sports and clubs', 'Creative hobbies', 'Social activities', 'Gaming', 'Music and art', 'Volunteer work', 'School activities'];
    }
  }
}

export default new ChildMindService();
