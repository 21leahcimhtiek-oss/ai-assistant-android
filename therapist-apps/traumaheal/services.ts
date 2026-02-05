// TraumaHeal Core Services

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// TRAUMA TIMELINE SERVICE
// ============================================================================

export interface TraumaEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  severity: number; // 1-10
  type: 'single' | 'repeated' | 'complex';
  triggers: string[];
  symptoms: string[];
  createdAt: number;
}

export const TraumaTimelineService = {
  async addEvent(event: Omit<TraumaEvent, 'id' | 'createdAt'>): Promise<TraumaEvent> {
    const id = Date.now().toString();
    const newEvent: TraumaEvent = {
      ...event,
      id,
      createdAt: Date.now(),
    };
    const events = await this.getAllEvents();
    events.push(newEvent);
    await AsyncStorage.setItem('trauma_timeline', JSON.stringify(events));
    return newEvent;
  },

  async getAllEvents(): Promise<TraumaEvent[]> {
    const data = await AsyncStorage.getItem('trauma_timeline');
    return data ? JSON.parse(data) : [];
  },

  async deleteEvent(id: string): Promise<void> {
    const events = await this.getAllEvents();
    const filtered = events.filter(e => e.id !== id);
    await AsyncStorage.setItem('trauma_timeline', JSON.stringify(filtered));
  },

  async getEventsByTrigger(trigger: string): Promise<TraumaEvent[]> {
    const events = await this.getAllEvents();
    return events.filter(e => e.triggers.includes(trigger));
  },
};

// ============================================================================
// GROUNDING TOOLS SERVICE
// ============================================================================

export interface GroundingExercise {
  id: string;
  name: string;
  description: string;
  duration: number; // seconds
  technique: 'sensory' | 'breathing' | 'movement' | 'bilateral';
  instructions: string[];
  completedAt?: number;
}

const GROUNDING_EXERCISES: GroundingExercise[] = [
  {
    id: '5-4-3-2-1',
    name: '5-4-3-2-1 Sensory Grounding',
    description: 'Notice 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste',
    duration: 300,
    technique: 'sensory',
    instructions: [
      'Look around and name 5 things you can see',
      'Touch 4 objects and describe their texture',
      'Listen and identify 3 sounds',
      'Notice 2 smells (real or imagined)',
      'Identify 1 taste in your mouth',
    ],
  },
  {
    id: 'butterfly-tapping',
    name: 'Butterfly Tapping',
    description: 'Bilateral stimulation using alternating hand taps',
    duration: 180,
    technique: 'bilateral',
    instructions: [
      'Cross your arms over your chest',
      'Tap alternately on each shoulder',
      'Continue for 1-3 minutes while breathing deeply',
      'Focus on the rhythm and sensation',
    ],
  },
  {
    id: 'box-breathing',
    name: 'Box Breathing',
    description: 'Structured breathing pattern for anxiety reduction',
    duration: 240,
    technique: 'breathing',
    instructions: [
      'Inhale for 4 counts',
      'Hold for 4 counts',
      'Exhale for 4 counts',
      'Hold for 4 counts',
      'Repeat 5-10 times',
    ],
  },
  {
    id: 'grounding-object',
    name: 'Grounding Object Focus',
    description: 'Use a physical object to anchor to the present moment',
    duration: 120,
    technique: 'sensory',
    instructions: [
      'Hold a small object (stone, ice cube, textured item)',
      'Focus on its temperature, texture, weight',
      'Describe it in detail to yourself',
      'Notice how it grounds you in the present',
    ],
  },
];

export const GroundingService = {
  async getExercises(): Promise<GroundingExercise[]> {
    return GROUNDING_EXERCISES;
  },

  async logCompletion(exerciseId: string): Promise<void> {
    const completions = await AsyncStorage.getItem('grounding_completions');
    const logs = completions ? JSON.parse(completions) : [];
    logs.push({ exerciseId, completedAt: Date.now() });
    await AsyncStorage.setItem('grounding_completions', JSON.stringify(logs));
  },

  async getCompletionStats(): Promise<{ total: number; thisWeek: number }> {
    const completions = await AsyncStorage.getItem('grounding_completions');
    const logs = completions ? JSON.parse(completions) : [];
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      total: logs.length,
      thisWeek: logs.filter((log: any) => log.completedAt > weekAgo).length,
    };
  },
};

// ============================================================================
// EMDR SIMULATION SERVICE
// ============================================================================

export interface EMDRSession {
  id: string;
  targetMemory: string;
  intensity: number; // 1-10 before processing
  bilateralStimulation: 'visual' | 'auditory' | 'tactile';
  duration: number; // seconds
  intensityAfter?: number;
  completedAt?: number;
}

export const EMDRService = {
  async startSession(memory: string, intensity: number): Promise<EMDRSession> {
    return {
      id: Date.now().toString(),
      targetMemory: memory,
      intensity,
      bilateralStimulation: 'visual',
      duration: 600, // 10 minutes default
    };
  },

  async completeSession(session: EMDRSession, intensityAfter: number): Promise<void> {
    const sessions = await AsyncStorage.getItem('emdr_sessions');
    const logs = sessions ? JSON.parse(sessions) : [];
    logs.push({
      ...session,
      intensityAfter,
      completedAt: Date.now(),
    });
    await AsyncStorage.setItem('emdr_sessions', JSON.stringify(logs));
  },

  async getSessionHistory(): Promise<EMDRSession[]> {
    const sessions = await AsyncStorage.getItem('emdr_sessions');
    return sessions ? JSON.parse(sessions) : [];
  },
};

// ============================================================================
// TRAUMA-FOCUSED AI THERAPIST SERVICE
// ============================================================================

export interface TherapyMessage {
  id: string;
  role: 'user' | 'therapist';
  content: string;
  timestamp: number;
  traumaFocus?: 'processing' | 'grounding' | 'safety' | 'coping';
}

export const TraumaTherapistService = {
  async sendMessage(userMessage: string, history: TherapyMessage[]): Promise<string> {
    // Simulated trauma-focused AI response
    const traumaPrompts = [
      'How is this memory affecting you today?',
      'What grounding technique might help right now?',
      'Can you describe what triggered this feeling?',
      'What coping strategies have worked for you before?',
      'How safe do you feel right now?',
    ];

    // In production, this would call OpenRouter with trauma-focused system prompt
    return traumaPrompts[Math.floor(Math.random() * traumaPrompts.length)];
  },

  async detectCrisis(message: string): Promise<boolean> {
    const crisisKeywords = ['suicide', 'hurt myself', 'end it', 'harm', 'overdose', 'die'];
    return crisisKeywords.some(keyword => message.toLowerCase().includes(keyword));
  },

  async saveSession(messages: TherapyMessage[]): Promise<void> {
    const sessions = await AsyncStorage.getItem('trauma_therapy_sessions');
    const logs = sessions ? JSON.parse(sessions) : [];
    logs.push({
      messages,
      createdAt: Date.now(),
    });
    await AsyncStorage.setItem('trauma_therapy_sessions', JSON.stringify(logs));
  },
};

// ============================================================================
// SAFETY PLAN SERVICE
// ============================================================================

export interface SafetyPlan {
  id: string;
  warningSignsOfCrisis: string[];
  internalCopingStrategies: string[];
  socialSupport: { name: string; phone: string }[];
  professionalContacts: { name: string; phone: string }[];
  crisisLines: { name: string; phone: string }[];
  createdAt: number;
}

export const SafetyPlanService = {
  async createPlan(plan: Omit<SafetyPlan, 'id' | 'createdAt'>): Promise<SafetyPlan> {
    const id = Date.now().toString();
    const newPlan: SafetyPlan = {
      ...plan,
      id,
      createdAt: Date.now(),
    };
    await AsyncStorage.setItem('safety_plan', JSON.stringify(newPlan));
    return newPlan;
  },

  async getPlan(): Promise<SafetyPlan | null> {
    const data = await AsyncStorage.getItem('safety_plan');
    return data ? JSON.parse(data) : null;
  },

  async updatePlan(updates: Partial<SafetyPlan>): Promise<SafetyPlan | null> {
    const currentPlan = await this.getPlan();
    if (!currentPlan) return null;
    const updated = { ...currentPlan, ...updates };
    await AsyncStorage.setItem('safety_plan', JSON.stringify(updated));
    return updated;
  },
};

// ============================================================================
// TRAUMA RECOVERY TRACKING
// ============================================================================

export interface RecoveryMetric {
  date: string;
  flashbackFrequency: number; // 0-10
  nightmareFrequency: number; // 0-10
  hyperarousal: number; // 0-10
  avoidance: number; // 0-10
  emotionalNumbing: number; // 0-10
  overallWellness: number; // 0-10
}

export const RecoveryTrackingService = {
  async logMetrics(metrics: RecoveryMetric): Promise<void> {
    const data = await AsyncStorage.getItem('recovery_metrics');
    const logs = data ? JSON.parse(data) : [];
    logs.push(metrics);
    await AsyncStorage.setItem('recovery_metrics', JSON.stringify(logs));
  },

  async getMetricsHistory(): Promise<RecoveryMetric[]> {
    const data = await AsyncStorage.getItem('recovery_metrics');
    return data ? JSON.parse(data) : [];
  },

  async calculateRecoveryProgress(): Promise<number> {
    const metrics = await this.getMetricsHistory();
    if (metrics.length < 2) return 0;
    
    const first = metrics[0];
    const latest = metrics[metrics.length - 1];
    
    const improvement = (
      (first.flashbackFrequency - latest.flashbackFrequency) +
      (first.nightmareFrequency - latest.nightmareFrequency) +
      (first.hyperarousal - latest.hyperarousal) +
      (first.avoidance - latest.avoidance) +
      (first.emotionalNumbing - latest.emotionalNumbing)
    ) / 5;
    
    return Math.max(0, Math.min(100, improvement * 10));
  },
};
