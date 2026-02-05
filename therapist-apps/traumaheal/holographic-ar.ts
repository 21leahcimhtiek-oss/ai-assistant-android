// TraumaHeal Holographic AR & Interactive Service

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// HOLOGRAPHIC AR VISUALIZATION SERVICE
// ============================================================================

export interface HolographicObject {
  id: string;
  type: 'trauma-timeline' | 'emdr-butterfly' | 'grounding-sphere' | 'safety-shield' | 'healing-light';
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
  color: string;
  opacity: number;
  animated: boolean;
  interactable: boolean;
}

export interface ARScene {
  id: string;
  name: string;
  objects: HolographicObject[];
  backgroundColor: string;
  ambientLight: number;
  createdAt: number;
}

export const HolographicARService = {
  // Create holographic trauma timeline
  createTraumaTimeline(events: any[]): HolographicObject[] {
    return events.map((event, index) => ({
      id: `timeline-${event.id}`,
      type: 'trauma-timeline',
      position: {
        x: index * 0.5 - (events.length * 0.25),
        y: 0,
        z: -2,
      },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 0.3,
      color: this.getSeverityColor(event.severity),
      opacity: 0.8,
      animated: true,
      interactable: true,
    }));
  },

  // Create EMDR butterfly hologram
  createEMDRButterfly(): HolographicObject {
    return {
      id: 'emdr-butterfly',
      type: 'emdr-butterfly',
      position: { x: 0, y: 0, z: -1.5 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 0.8,
      color: '#FF69B4',
      opacity: 0.9,
      animated: true,
      interactable: true,
    };
  },

  // Create grounding sphere (5-4-3-2-1 visualization)
  createGroundingSphere(): HolographicObject {
    return {
      id: 'grounding-sphere',
      type: 'grounding-sphere',
      position: { x: 0, y: 0, z: -1 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1.2,
      color: '#00D4FF',
      opacity: 0.7,
      animated: true,
      interactable: true,
    };
  },

  // Create safety shield hologram
  createSafetyShield(): HolographicObject {
    return {
      id: 'safety-shield',
      type: 'safety-shield',
      position: { x: 0, y: 0.5, z: -2 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1.5,
      color: '#00FF00',
      opacity: 0.6,
      animated: false,
      interactable: true,
    };
  },

  // Create healing light field
  createHealingLight(): HolographicObject {
    return {
      id: 'healing-light',
      type: 'healing-light',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 2,
      color: '#FFD700',
      opacity: 0.5,
      animated: true,
      interactable: false,
    };
  },

  // Get color based on trauma severity
  getSeverityColor(severity: number): string {
    if (severity <= 3) return '#00FF00'; // Green - mild
    if (severity <= 6) return '#FFFF00'; // Yellow - moderate
    if (severity <= 8) return '#FF8800'; // Orange - severe
    return '#FF0000'; // Red - critical
  },

  // Create AR scene
  async createScene(name: string, objects: HolographicObject[]): Promise<ARScene> {
    const scene: ARScene = {
      id: Date.now().toString(),
      name,
      objects,
      backgroundColor: '#000033',
      ambientLight: 0.7,
      createdAt: Date.now(),
    };
    const scenes = await AsyncStorage.getItem('ar_scenes');
    const sceneList = scenes ? JSON.parse(scenes) : [];
    sceneList.push(scene);
    await AsyncStorage.setItem('ar_scenes', JSON.stringify(sceneList));
    return scene;
  },

  // Get saved AR scenes
  async getScenes(): Promise<ARScene[]> {
    const data = await AsyncStorage.getItem('ar_scenes');
    return data ? JSON.parse(data) : [];
  },
};

// ============================================================================
// GESTURE RECOGNITION SERVICE
// ============================================================================

export interface GestureEvent {
  type: 'swipe' | 'pinch' | 'rotate' | 'tap' | 'hold' | 'hand-wave' | 'bilateral-tap';
  direction?: 'left' | 'right' | 'up' | 'down';
  intensity: number; // 0-1
  targetObject?: string;
  timestamp: number;
}

export interface HandTrackingData {
  leftHand: { x: number; y: number; z: number; confidence: number };
  rightHand: { x: number; y: number; z: number; confidence: number };
  gestureDetected: string | null;
}

export const GestureRecognitionService = {
  // Detect bilateral hand tapping (for EMDR)
  detectBilateralTap(leftHand: any, rightHand: any): boolean {
    const leftMoving = Math.abs(leftHand.velocity) > 0.5;
    const rightMoving = Math.abs(rightHand.velocity) > 0.5;
    const alternating = leftHand.lastTapTime && rightHand.lastTapTime &&
      Math.abs(leftHand.lastTapTime - rightHand.lastTapTime) < 500;
    
    return leftMoving && rightMoving && alternating;
  },

  // Detect hand wave (for grounding)
  detectHandWave(hand: any): boolean {
    return hand.velocity > 1.0 && hand.trajectory === 'wave';
  },

  // Detect pinch gesture (for trauma timeline interaction)
  detectPinch(leftHand: any, rightHand: any): number {
    const distance = Math.sqrt(
      Math.pow(rightHand.x - leftHand.x, 2) +
      Math.pow(rightHand.y - leftHand.y, 2) +
      Math.pow(rightHand.z - leftHand.z, 2)
    );
    return Math.max(0, Math.min(1, 1 - distance / 0.3));
  },

  // Process gesture
  async processGesture(gesture: GestureEvent): Promise<void> {
    const gestures = await AsyncStorage.getItem('gesture_log');
    const log = gestures ? JSON.parse(gestures) : [];
    log.push(gesture);
    await AsyncStorage.setItem('gesture_log', JSON.stringify(log));
  },

  // Get gesture history
  async getGestureHistory(): Promise<GestureEvent[]> {
    const data = await AsyncStorage.getItem('gesture_log');
    return data ? JSON.parse(data) : [];
  },
};

// ============================================================================
// IMMERSIVE EMDR HOLOGRAPHIC SERVICE
// ============================================================================

export interface EMDRHologramSession {
  id: string;
  targetMemory: string;
  bilateralPattern: 'horizontal' | 'diagonal' | 'circular' | 'figure-eight';
  speed: number; // 1-10
  duration: number; // seconds
  visualStyle: 'butterfly' | 'lights' | 'waves' | 'particles';
  hapticFeedback: boolean;
  startedAt?: number;
  completedAt?: number;
}

export const EMDRHologramService = {
  // Create EMDR hologram session
  async createSession(memory: string, speed: number = 5): Promise<EMDRHologramSession> {
    const session: EMDRHologramSession = {
      id: Date.now().toString(),
      targetMemory: memory,
      bilateralPattern: 'horizontal',
      speed,
      duration: 600, // 10 minutes
      visualStyle: 'butterfly',
      hapticFeedback: true,
    };
    return session;
  },

  // Generate bilateral movement pattern
  generateBilateralPattern(pattern: string, speed: number): any[] {
    const frames = [];
    const frameCount = 60 * (speed / 5); // Adjust for speed
    
    for (let i = 0; i < frameCount; i++) {
      const progress = i / frameCount;
      let x = 0, y = 0;

      switch (pattern) {
        case 'horizontal':
          x = Math.cos(progress * Math.PI * 2) * 0.5;
          break;
        case 'diagonal':
          x = Math.cos(progress * Math.PI * 2) * 0.5;
          y = Math.sin(progress * Math.PI * 2) * 0.5;
          break;
        case 'circular':
          x = Math.cos(progress * Math.PI * 2) * 0.5;
          y = Math.sin(progress * Math.PI * 2) * 0.5;
          break;
        case 'figure-eight':
          x = Math.sin(progress * Math.PI * 2) * 0.5;
          y = Math.sin(progress * Math.PI * 4) * 0.25;
          break;
      }

      frames.push({ x, y, timestamp: i * (1000 / frameCount) });
    }
    return frames;
  },

  // Complete EMDR session
  async completeSession(session: EMDRHologramSession, intensityReduction: number): Promise<void> {
    const sessions = await AsyncStorage.getItem('emdr_hologram_sessions');
    const log = sessions ? JSON.parse(sessions) : [];
    log.push({
      ...session,
      completedAt: Date.now(),
      intensityReduction,
    });
    await AsyncStorage.setItem('emdr_hologram_sessions', JSON.stringify(log));
  },
};

// ============================================================================
// SPATIAL COMPUTING ENVIRONMENT SERVICE
// ============================================================================

export interface SpatialEnvironment {
  id: string;
  name: string;
  type: 'safe-space' | 'trauma-processing' | 'grounding' | 'healing';
  ambience: 'calm' | 'energetic' | 'neutral';
  soundscape: string; // URL or preset name
  lighting: { color: string; intensity: number };
  objects: HolographicObject[];
  createdAt: number;
}

export const SpatialComputingService = {
  // Create safe space environment
  createSafeSpace(): SpatialEnvironment {
    return {
      id: 'safe-space-' + Date.now(),
      name: 'Personal Safe Space',
      type: 'safe-space',
      ambience: 'calm',
      soundscape: 'ocean-waves',
      lighting: { color: '#87CEEB', intensity: 0.6 },
      objects: [
        HolographicARService.createHealingLight(),
        HolographicARService.createSafetyShield(),
      ],
      createdAt: Date.now(),
    };
  },

  // Create trauma processing environment
  createTraumaProcessingEnv(traumaEvents: any[]): SpatialEnvironment {
    return {
      id: 'trauma-env-' + Date.now(),
      name: 'Trauma Processing Space',
      type: 'trauma-processing',
      ambience: 'neutral',
      soundscape: 'white-noise',
      lighting: { color: '#FFD700', intensity: 0.8 },
      objects: HolographicARService.createTraumaTimeline(traumaEvents),
      createdAt: Date.now(),
    };
  },

  // Create grounding environment
  createGroundingEnv(): SpatialEnvironment {
    return {
      id: 'grounding-env-' + Date.now(),
      name: 'Grounding Space',
      type: 'grounding',
      ambience: 'calm',
      soundscape: 'forest-ambient',
      lighting: { color: '#00FF00', intensity: 0.7 },
      objects: [HolographicARService.createGroundingSphere()],
      createdAt: Date.now(),
    };
  },

  // Save environment
  async saveEnvironment(env: SpatialEnvironment): Promise<void> {
    const envs = await AsyncStorage.getItem('spatial_environments');
    const list = envs ? JSON.parse(envs) : [];
    list.push(env);
    await AsyncStorage.setItem('spatial_environments', JSON.stringify(list));
  },

  // Get environments
  async getEnvironments(): Promise<SpatialEnvironment[]> {
    const data = await AsyncStorage.getItem('spatial_environments');
    return data ? JSON.parse(data) : [];
  },
};

// ============================================================================
// HAPTIC FEEDBACK SERVICE
// ============================================================================

export interface HapticPattern {
  name: string;
  pattern: number[]; // Intensity values 0-1
  duration: number; // milliseconds
}

export const HapticFeedbackService = {
  // Bilateral tapping haptic pattern
  bilateralTapPattern: {
    name: 'bilateral-tap',
    pattern: [0.5, 0, 0.5, 0, 0.5, 0, 0.5],
    duration: 1400,
  },

  // Grounding pulse pattern
  groundingPulsePattern: {
    name: 'grounding-pulse',
    pattern: [0.3, 0.6, 0.9, 0.6, 0.3],
    duration: 1000,
  },

  // Safety shield pattern
  safetyShieldPattern: {
    name: 'safety-shield',
    pattern: [0.7, 0.7, 0.7],
    duration: 600,
  },

  // Healing light pattern
  healingLightPattern: {
    name: 'healing-light',
    pattern: [0.2, 0.4, 0.6, 0.8, 1.0, 0.8, 0.6, 0.4, 0.2],
    duration: 2000,
  },

  // Trigger haptic pattern
  async triggerPattern(pattern: HapticPattern): Promise<void> {
    // In production, this would use Expo.Haptics or native haptic APIs
    console.log(`Triggering haptic pattern: ${pattern.name}`);
  },

  // Create custom pattern
  createCustomPattern(intensities: number[], duration: number): HapticPattern {
    return {
      name: 'custom-' + Date.now(),
      pattern: intensities,
      duration,
    };
  },
};
