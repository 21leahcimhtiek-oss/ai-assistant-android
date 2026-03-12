import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CrisisResource {
  id: string;
  name: string;
  description: string;
  phone: string;
  text?: string;
  website?: string;
  available: string;
  type: 'hotline' | 'text' | 'chat' | 'emergency';
}

export interface SafetyPlanItem {
  id: string;
  category: 'warning-signs' | 'coping-strategies' | 'distractions' | 'support-people' | 'professionals' | 'safe-environment';
  content: string;
  order: number;
}

const SAFETY_PLAN_KEY = '@mindspace_safety_plan';

// Crisis resources (US-focused, can be customized by location)
export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    id: 'suicide-lifeline',
    name: '988 Suicide & Crisis Lifeline',
    description: 'Free, confidential support for people in distress, prevention and crisis resources.',
    phone: '988',
    text: '988',
    website: 'https://988lifeline.org',
    available: '24/7',
    type: 'hotline',
  },
  {
    id: 'crisis-text-line',
    name: 'Crisis Text Line',
    description: 'Free, 24/7 support for those in crisis. Text to connect with a trained crisis counselor.',
    phone: '',
    text: 'Text HELLO to 741741',
    website: 'https://www.crisistextline.org',
    available: '24/7',
    type: 'text',
  },
  {
    id: 'samhsa-helpline',
    name: 'SAMHSA National Helpline',
    description: 'Treatment referral and information service for mental health and substance use disorders.',
    phone: '1-800-662-4357',
    website: 'https://www.samhsa.gov/find-help/national-helpline',
    available: '24/7',
    type: 'hotline',
  },
  {
    id: 'nami-helpline',
    name: 'NAMI HelpLine',
    description: 'Information, resource referrals and support for mental health questions.',
    phone: '1-800-950-6264',
    text: 'Text NAMI to 741741',
    website: 'https://www.nami.org/help',
    available: 'Mon-Fri 10am-10pm ET',
    type: 'hotline',
  },
  {
    id: 'trevor-project',
    name: 'The Trevor Project',
    description: 'Crisis intervention and suicide prevention for LGBTQ+ young people.',
    phone: '1-866-488-7386',
    text: 'Text START to 678678',
    website: 'https://www.thetrevorproject.org',
    available: '24/7',
    type: 'hotline',
  },
  {
    id: 'veterans-crisis',
    name: 'Veterans Crisis Line',
    description: 'Support for veterans and their families.',
    phone: '988 (Press 1)',
    text: 'Text 838255',
    website: 'https://www.veteranscrisisline.net',
    available: '24/7',
    type: 'hotline',
  },
  {
    id: 'emergency',
    name: '911 Emergency',
    description: 'For immediate life-threatening emergencies.',
    phone: '911',
    available: '24/7',
    type: 'emergency',
  },
];

// Supportive messages for crisis moments
export const CRISIS_MESSAGES = [
  "You are not alone. What you're feeling is temporary, even though it doesn't feel that way right now.",
  "This moment is difficult, but you have survived 100% of your worst days so far. You can get through this one too.",
  "Your life matters. Your story isn't over. There are people who care about you and want to help.",
  "Crisis moments pass. The pain you feel right now will not last forever. Please reach out for support.",
  "You deserve help and support. Reaching out is a sign of strength, not weakness.",
  "Your feelings are valid, but they don't have to define your actions. Please stay safe and reach out.",
];

class CrisisSupportService {
  /**
   * Get all crisis resources
   */
  getAllResources(): CrisisResource[] {
    return CRISIS_RESOURCES;
  }

  /**
   * Get resources by type
   */
  getResourcesByType(type: CrisisResource['type']): CrisisResource[] {
    return CRISIS_RESOURCES.filter(resource => resource.type === type);
  }

  /**
   * Get a random supportive message
   */
  getSupportiveMessage(): string {
    return CRISIS_MESSAGES[Math.floor(Math.random() * CRISIS_MESSAGES.length)];
  }

  /**
   * Get safety plan
   */
  async getSafetyPlan(): Promise<SafetyPlanItem[]> {
    try {
      const data = await AsyncStorage.getItem(SAFETY_PLAN_KEY);
      return data ? JSON.parse(data) : this.getDefaultSafetyPlan();
    } catch (error) {
      console.error('Error loading safety plan:', error);
      return this.getDefaultSafetyPlan();
    }
  }

  /**
   * Save safety plan
   */
  async saveSafetyPlan(items: SafetyPlanItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(SAFETY_PLAN_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving safety plan:', error);
      throw error;
    }
  }

  /**
   * Add item to safety plan
   */
  async addSafetyPlanItem(item: Omit<SafetyPlanItem, 'id' | 'order'>): Promise<void> {
    try {
      const items = await this.getSafetyPlan();
      const newItem: SafetyPlanItem = {
        ...item,
        id: `safety_${Date.now()}`,
        order: items.length,
      };
      items.push(newItem);
      await this.saveSafetyPlan(items);
    } catch (error) {
      console.error('Error adding safety plan item:', error);
      throw error;
    }
  }

  /**
   * Update safety plan item
   */
  async updateSafetyPlanItem(id: string, updates: Partial<SafetyPlanItem>): Promise<void> {
    try {
      const items = await this.getSafetyPlan();
      const index = items.findIndex(item => item.id === id);
      if (index >= 0) {
        items[index] = { ...items[index], ...updates };
        await this.saveSafetyPlan(items);
      }
    } catch (error) {
      console.error('Error updating safety plan item:', error);
      throw error;
    }
  }

  /**
   * Delete safety plan item
   */
  async deleteSafetyPlanItem(id: string): Promise<void> {
    try {
      const items = await this.getSafetyPlan();
      const remainingItems = items.filter(item => item.id !== id);
      await this.saveSafetyPlan(remainingItems);
    } catch (error) {
      console.error('Error deleting safety plan item:', error);
      throw error;
    }
  }

  /**
   * Get default safety plan template
   */
  private getDefaultSafetyPlan(): SafetyPlanItem[] {
    return [
      {
        id: 'default_1',
        category: 'warning-signs',
        content: 'Identify your personal warning signs (thoughts, images, moods, situations, behaviors)',
        order: 0,
      },
      {
        id: 'default_2',
        category: 'coping-strategies',
        content: 'List coping strategies you can do on your own (without contacting others)',
        order: 1,
      },
      {
        id: 'default_3',
        category: 'distractions',
        content: 'List places and social settings that provide distraction',
        order: 2,
      },
      {
        id: 'default_4',
        category: 'support-people',
        content: 'List people you can ask for help (friends, family members)',
        order: 3,
      },
      {
        id: 'default_5',
        category: 'professionals',
        content: 'List professionals or agencies to contact during a crisis',
        order: 4,
      },
      {
        id: 'default_6',
        category: 'safe-environment',
        content: 'Make your environment safe (remove means of self-harm)',
        order: 5,
      },
    ];
  }

  /**
   * Get safety plan items by category
   */
  async getSafetyPlanByCategory(category: SafetyPlanItem['category']): Promise<SafetyPlanItem[]> {
    try {
      const items = await this.getSafetyPlan();
      return items
        .filter(item => item.category === category)
        .sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error('Error loading safety plan by category:', error);
      return [];
    }
  }

  /**
   * Get category display name
   */
  getCategoryName(category: SafetyPlanItem['category']): string {
    const names: Record<SafetyPlanItem['category'], string> = {
      'warning-signs': 'Warning Signs',
      'coping-strategies': 'Coping Strategies',
      'distractions': 'Distractions',
      'support-people': 'Support People',
      'professionals': 'Professionals',
      'safe-environment': 'Safe Environment',
    };
    return names[category];
  }

  /**
   * Get category description
   */
  getCategoryDescription(category: SafetyPlanItem['category']): string {
    const descriptions: Record<SafetyPlanItem['category'], string> = {
      'warning-signs': 'Recognize early signs that a crisis may be developing',
      'coping-strategies': 'Things you can do on your own to feel better',
      'distractions': 'Places and activities that take your mind off problems',
      'support-people': 'People you trust who can help you',
      'professionals': 'Mental health professionals and crisis services',
      'safe-environment': 'Steps to make your space safer during a crisis',
    };
    return descriptions[category];
  }
}

export const crisisSupport = new CrisisSupportService();
