// Cross-App Linking System for TraumaHeal & MindSpace Integration

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TherapyApp {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: 'trauma' | 'anxiety' | 'mood' | 'relationship' | 'addiction' | 'grief' | 'child' | 'sleep' | 'stress' | 'general';
  deepLink: string;
  installed: boolean;
}

export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  createdAt: number;
  lastUpdated: number;
  therapyApps: string[]; // Array of app IDs
}

export interface CrossAppData {
  userId: string;
  sourceApp: string;
  targetApp: string;
  dataType: 'mood' | 'progress' | 'journal' | 'session' | 'recovery';
  data: any;
  timestamp: number;
  permission: 'read' | 'write' | 'read-write';
}

export const THERAPY_APPS: Record<string, TherapyApp> = {
  mindspace: {
    id: 'mindspace',
    name: 'MindSpace',
    slug: 'mindspace',
    description: 'General mental health & CBT therapy',
    icon: '🧠',
    category: 'general',
    deepLink: 'mindspace://home',
    installed: true,
  },
  traumaheal: {
    id: 'traumaheal',
    name: 'TraumaHeal',
    slug: 'traumaheal',
    description: 'Holographic trauma-focused therapy',
    icon: '🌊',
    category: 'trauma',
    deepLink: 'traumaheal://home',
    installed: true,
  },
  relationshipai: {
    id: 'relationshipai',
    name: 'RelationshipAI',
    slug: 'relationshipai',
    description: 'Couples and relationship therapy',
    icon: '💑',
    category: 'relationship',
    deepLink: 'relationshipai://home',
    installed: false,
  },
  anxietycalm: {
    id: 'anxietycalm',
    name: 'AnxietyCalm',
    slug: 'anxietycalm',
    description: 'Anxiety disorder treatment',
    icon: '🌬️',
    category: 'anxiety',
    deepLink: 'anxietycalm://home',
    installed: false,
  },
  moodlift: {
    id: 'moodlift',
    name: 'MoodLift',
    slug: 'moodlift',
    description: 'Depression and mood management',
    icon: '☀️',
    category: 'mood',
    deepLink: 'moodlift://home',
    installed: false,
  },
  addictionfree: {
    id: 'addictionfree',
    name: 'AddictionFree',
    slug: 'addictionfree',
    description: 'Addiction recovery support',
    icon: '🔗',
    category: 'addiction',
    deepLink: 'addictionfree://home',
    installed: false,
  },
  griefcompanion: {
    id: 'griefcompanion',
    name: 'GriefCompanion',
    slug: 'griefcompanion',
    description: 'Grief and bereavement support',
    icon: '🕯️',
    category: 'grief',
    deepLink: 'griefcompanion://home',
    installed: false,
  },
  childmind: {
    id: 'childmind',
    name: 'ChildMind',
    slug: 'childmind',
    description: 'Child and adolescent mental health',
    icon: '👧',
    category: 'child',
    deepLink: 'childmind://home',
    installed: false,
  },
  sleepwell: {
    id: 'sleepwell',
    name: 'SleepWell',
    slug: 'sleepwell',
    description: 'Sleep disorders and insomnia treatment',
    icon: '😴',
    category: 'sleep',
    deepLink: 'sleepwell://home',
    installed: false,
  },
  stressrelief: {
    id: 'stressrelief',
    name: 'StressRelief',
    slug: 'stressrelief',
    description: 'Stress management and resilience',
    icon: '🧘',
    category: 'stress',
    deepLink: 'stressrelief://home',
    installed: false,
  },
};

export const CrossAppLinkingService = {
  // Get user profile
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const profile = await AsyncStorage.getItem('user_profile');
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },

  // Create or update user profile
  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      profile.lastUpdated = Date.now();
      await AsyncStorage.setItem('user_profile', JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  },

  // Link user to therapy app
  async linkTherapyApp(userId: string, appId: string): Promise<void> {
    try {
      const profile = await this.getUserProfile();
      if (!profile) {
        const newProfile: UserProfile = {
          userId,
          email: '',
          name: '',
          createdAt: Date.now(),
          lastUpdated: Date.now(),
          therapyApps: [appId],
        };
        await this.saveUserProfile(newProfile);
      } else {
        if (!profile.therapyApps.includes(appId)) {
          profile.therapyApps.push(appId);
          await this.saveUserProfile(profile);
        }
      }
    } catch (error) {
      console.error('Error linking therapy app:', error);
    }
  },

  // Unlink therapy app
  async unlinkTherapyApp(userId: string, appId: string): Promise<void> {
    try {
      const profile = await this.getUserProfile();
      if (profile) {
        profile.therapyApps = profile.therapyApps.filter(id => id !== appId);
        await this.saveUserProfile(profile);
      }
    } catch (error) {
      console.error('Error unlinking therapy app:', error);
    }
  },

  // Get linked therapy apps
  async getLinkedApps(): Promise<TherapyApp[]> {
    try {
      const profile = await this.getUserProfile();
      if (!profile) return [];

      return profile.therapyApps
        .map(appId => THERAPY_APPS[appId])
        .filter(app => app !== undefined);
    } catch (error) {
      console.error('Error getting linked apps:', error);
      return [];
    }
  },

  // Share data between apps
  async shareData(
    sourceApp: string,
    targetApp: string,
    dataType: string,
    data: any,
    permission: 'read' | 'write' | 'read-write' = 'read'
  ): Promise<void> {
    try {
      const crossAppData: CrossAppData = {
        userId: (await this.getUserProfile())?.userId || '',
        sourceApp,
        targetApp,
        dataType: dataType as any,
        data,
        timestamp: Date.now(),
        permission,
      };

      const key = `cross_app_data_${sourceApp}_${targetApp}_${dataType}`;
      await AsyncStorage.setItem(key, JSON.stringify(crossAppData));
    } catch (error) {
      console.error('Error sharing data:', error);
    }
  },

  // Get shared data
  async getSharedData(
    sourceApp: string,
    targetApp: string,
    dataType: string
  ): Promise<CrossAppData | null> {
    try {
      const key = `cross_app_data_${sourceApp}_${targetApp}_${dataType}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting shared data:', error);
      return null;
    }
  },

  // Get all shared data for an app
  async getAllSharedData(appId: string): Promise<CrossAppData[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const crossAppKeys = allKeys.filter(key => key.startsWith('cross_app_data_'));

      const results: CrossAppData[] = [];
      for (const key of crossAppKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.targetApp === appId || parsed.sourceApp === appId) {
            results.push(parsed);
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Error getting all shared data:', error);
      return [];
    }
  },

  // Share mood data from MindSpace to TraumaHeal
  async shareMoodData(moodData: any): Promise<void> {
    await this.shareData('mindspace', 'traumaheal', 'mood', moodData, 'read');
  },

  // Share session data
  async shareSessionData(sessionData: any, sourceApp: string, targetApp: string): Promise<void> {
    await this.shareData(sourceApp, targetApp, 'session', sessionData, 'read');
  },

  // Share recovery progress
  async shareRecoveryProgress(progress: any, sourceApp: string): Promise<void> {
    const linkedApps = await this.getLinkedApps();
    for (const app of linkedApps) {
      if (app.id !== sourceApp) {
        await this.shareData(sourceApp, app.id, 'progress', progress, 'read');
      }
    }
  },

  // Get deep link for app
  getDeepLink(appId: string, screen?: string, params?: Record<string, any>): string {
    const app = THERAPY_APPS[appId];
    if (!app) return '';

    let link = app.deepLink;
    if (screen) {
      link = `${appId}://${screen}`;
    }
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      link = `${link}?${queryString}`;
    }
    return link;
  },

  // Get app recommendations based on user profile
  async getRecommendedApps(currentAppId: string): Promise<TherapyApp[]> {
    const linkedApps = await this.getLinkedApps();
    const linkedIds = new Set(linkedApps.map(app => app.id));

    return Object.values(THERAPY_APPS)
      .filter(app => app.id !== currentAppId && !linkedIds.has(app.id))
      .slice(0, 3); // Return top 3 recommendations
  },

  // Create unified dashboard data
  async getUnifiedDashboard(): Promise<{
    linkedApps: TherapyApp[];
    recentSessions: any[];
    overallProgress: number;
    recommendations: TherapyApp[];
  }> {
    const linkedApps = await this.getLinkedApps();
    const allSharedData = await this.getAllSharedData('traumaheal');
    const recommendations = await this.getRecommendedApps('traumaheal');

    // Calculate overall progress
    const progressData = allSharedData.filter(d => d.dataType === 'progress');
    const overallProgress = progressData.length > 0
      ? Math.round(
          progressData.reduce((sum, d) => sum + (d.data.score || 0), 0) / progressData.length
        )
      : 0;

    return {
      linkedApps,
      recentSessions: allSharedData.slice(-5),
      overallProgress,
      recommendations,
    };
  },

  // Sync user data across apps
  async syncUserData(userId: string): Promise<void> {
    try {
      const profile = await this.getUserProfile();
      if (!profile) return;

      // Sync profile across all linked apps
      for (const appId of profile.therapyApps) {
        const key = `user_profile_${appId}`;
        await AsyncStorage.setItem(key, JSON.stringify(profile));
      }
    } catch (error) {
      console.error('Error syncing user data:', error);
    }
  },

  // Get all available therapy apps
  getAllApps(): TherapyApp[] {
    return Object.values(THERAPY_APPS);
  },

  // Get apps by category
  getAppsByCategory(category: string): TherapyApp[] {
    return Object.values(THERAPY_APPS).filter(app => app.category === category);
  },
};

export default CrossAppLinkingService;
