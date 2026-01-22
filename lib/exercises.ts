import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Exercise {
  id: string;
  title: string;
  description: string;
  category: ExerciseCategory;
  duration: number; // in minutes
  steps: string[];
  benefits: string[];
  icon: string;
}

export type ExerciseCategory = 
  | 'breathing'
  | 'grounding'
  | 'thought-challenging'
  | 'relaxation'
  | 'gratitude'
  | 'mindfulness';

export interface ExerciseCompletion {
  exerciseId: string;
  timestamp: number;
  helpfulness: number; // 1-5 rating
  notes?: string;
}

const COMPLETIONS_KEY = '@mindspace_exercise_completions';

// Library of CBT exercises and coping tools
export const EXERCISES: Exercise[] = [
  // Breathing Exercises
  {
    id: 'box-breathing',
    title: 'Box Breathing',
    description: 'A calming breathing technique used by Navy SEALs to reduce stress and anxiety.',
    category: 'breathing',
    duration: 5,
    icon: '🫁',
    steps: [
      'Sit comfortably with your back straight',
      'Breathe in through your nose for 4 counts',
      'Hold your breath for 4 counts',
      'Breathe out through your mouth for 4 counts',
      'Hold empty for 4 counts',
      'Repeat for 5 minutes',
    ],
    benefits: [
      'Reduces stress and anxiety',
      'Improves focus and concentration',
      'Lowers blood pressure',
      'Activates parasympathetic nervous system',
    ],
  },
  {
    id: '478-breathing',
    title: '4-7-8 Breathing',
    description: 'A powerful breathing technique to calm the mind and body, especially helpful for sleep.',
    category: 'breathing',
    duration: 3,
    icon: '🫁',
    steps: [
      'Place the tip of your tongue behind your upper front teeth',
      'Exhale completely through your mouth',
      'Close your mouth and inhale through your nose for 4 counts',
      'Hold your breath for 7 counts',
      'Exhale completely through your mouth for 8 counts',
      'Repeat 4 times',
    ],
    benefits: [
      'Reduces anxiety quickly',
      'Helps with falling asleep',
      'Calms racing thoughts',
      'Reduces stress response',
    ],
  },

  // Grounding Exercises
  {
    id: '54321-grounding',
    title: '5-4-3-2-1 Grounding',
    description: 'A sensory awareness technique to bring you back to the present moment during anxiety or panic.',
    category: 'grounding',
    duration: 5,
    icon: '🧘',
    steps: [
      'Look around and name 5 things you can SEE',
      'Notice 4 things you can TOUCH (texture, temperature)',
      'Listen for 3 things you can HEAR',
      'Identify 2 things you can SMELL',
      'Notice 1 thing you can TASTE',
      'Take a deep breath and notice how you feel',
    ],
    benefits: [
      'Stops panic attacks',
      'Brings you to the present',
      'Reduces dissociation',
      'Calms overwhelming emotions',
    ],
  },
  {
    id: 'body-scan',
    title: 'Body Scan Meditation',
    description: 'A mindfulness practice to release tension and connect with your body.',
    category: 'grounding',
    duration: 10,
    icon: '🧘',
    steps: [
      'Lie down or sit comfortably',
      'Close your eyes and take 3 deep breaths',
      'Bring attention to your toes. Notice any sensations',
      'Slowly move attention up through feet, legs, hips',
      'Continue through torso, arms, hands, neck, head',
      'Notice areas of tension without judgment',
      'Breathe into tense areas and release',
      'End with full body awareness',
    ],
    benefits: [
      'Releases physical tension',
      'Improves body awareness',
      'Reduces stress',
      'Helps with sleep',
    ],
  },

  // Thought Challenging
  {
    id: 'thought-record',
    title: 'Thought Record',
    description: 'A CBT technique to identify and challenge negative automatic thoughts.',
    category: 'thought-challenging',
    duration: 10,
    icon: '💭',
    steps: [
      'Identify the situation that triggered negative emotions',
      'Write down your automatic thoughts',
      'Identify the emotions and rate their intensity (0-10)',
      'Look for cognitive distortions (all-or-nothing, catastrophizing, etc.)',
      'Challenge the thought: What is the evidence for and against it?',
      'Create a balanced, realistic alternative thought',
      'Re-rate your emotion intensity',
    ],
    benefits: [
      'Reduces negative thinking',
      'Improves emotional regulation',
      'Increases self-awareness',
      'Builds resilience',
    ],
  },
  {
    id: 'cognitive-distortions',
    title: 'Identify Cognitive Distortions',
    description: 'Learn to recognize common thinking errors that worsen mood.',
    category: 'thought-challenging',
    duration: 5,
    icon: '💭',
    steps: [
      'Think of a recent negative thought',
      'Check if it matches these distortions:',
      '• All-or-nothing thinking (black and white)',
      '• Overgeneralization (always, never)',
      '• Mental filter (focusing only on negatives)',
      '• Catastrophizing (expecting the worst)',
      '• Mind reading (assuming what others think)',
      '• Should statements (rigid rules)',
      'Name the distortion and reframe the thought',
    ],
    benefits: [
      'Recognizes thinking patterns',
      'Reduces anxiety and depression',
      'Improves perspective',
      'Builds cognitive flexibility',
    ],
  },

  // Progressive Relaxation
  {
    id: 'progressive-muscle-relaxation',
    title: 'Progressive Muscle Relaxation',
    description: 'Systematically tense and relax muscle groups to release physical tension.',
    category: 'relaxation',
    duration: 15,
    icon: '💆',
    steps: [
      'Find a quiet, comfortable place',
      'Tense your fists for 5 seconds, then release',
      'Tense your arms, then release',
      'Raise shoulders to ears, then drop',
      'Tense facial muscles, then relax',
      'Tense stomach muscles, then release',
      'Tense legs and feet, then relax',
      'Notice the difference between tension and relaxation',
      'Breathe deeply and enjoy the relaxed state',
    ],
    benefits: [
      'Reduces physical tension',
      'Helps with insomnia',
      'Lowers anxiety',
      'Improves body awareness',
    ],
  },

  // Gratitude Practices
  {
    id: 'gratitude-three-things',
    title: 'Three Good Things',
    description: 'A simple daily practice to shift focus toward the positive.',
    category: 'gratitude',
    duration: 5,
    icon: '🙏',
    steps: [
      'Think of three good things that happened today',
      'They can be small (good coffee) or big (promotion)',
      'For each one, write:',
      '• What happened?',
      '• Why did it happen?',
      '• How did it make you feel?',
      'Reflect on the positive emotions',
    ],
    benefits: [
      'Increases happiness',
      'Improves sleep',
      'Reduces depression',
      'Builds optimism',
    ],
  },
  {
    id: 'gratitude-letter',
    title: 'Gratitude Letter',
    description: 'Write a letter to someone who has positively impacted your life.',
    category: 'gratitude',
    duration: 20,
    icon: '🙏',
    steps: [
      'Think of someone who has helped or inspired you',
      'Write them a letter expressing your gratitude',
      'Be specific about what they did and how it affected you',
      'Describe how you feel now',
      'Optional: Deliver the letter in person or by mail',
      'Notice how writing and sharing gratitude feels',
    ],
    benefits: [
      'Strengthens relationships',
      'Increases happiness',
      'Reduces depression',
      'Builds social connection',
    ],
  },

  // Mindfulness
  {
    id: 'mindful-breathing',
    title: 'Mindful Breathing',
    description: 'A simple mindfulness meditation focusing on the breath.',
    category: 'mindfulness',
    duration: 10,
    icon: '🧘‍♀️',
    steps: [
      'Sit comfortably with eyes closed or softly focused',
      'Bring attention to your natural breath',
      'Notice the sensation of air entering and leaving',
      'When your mind wanders, gently return to the breath',
      'Don\'t judge yourself for wandering thoughts',
      'Continue for 10 minutes',
      'End with a moment of gratitude',
    ],
    benefits: [
      'Reduces stress',
      'Improves focus',
      'Increases self-awareness',
      'Calms the mind',
    ],
  },
];

class ExerciseService {
  /**
   * Get all exercises
   */
  getAllExercises(): Exercise[] {
    return EXERCISES;
  }

  /**
   * Get exercises by category
   */
  getExercisesByCategory(category: ExerciseCategory): Exercise[] {
    return EXERCISES.filter(ex => ex.category === category);
  }

  /**
   * Get a specific exercise
   */
  getExercise(id: string): Exercise | undefined {
    return EXERCISES.find(ex => ex.id === id);
  }

  /**
   * Log exercise completion
   */
  async logCompletion(completion: ExerciseCompletion): Promise<void> {
    try {
      const completions = await this.getCompletions();
      completions.push(completion);
      await AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
    } catch (error) {
      console.error('Error logging exercise completion:', error);
      throw error;
    }
  }

  /**
   * Get all exercise completions
   */
  async getCompletions(): Promise<ExerciseCompletion[]> {
    try {
      const data = await AsyncStorage.getItem(COMPLETIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading completions:', error);
      return [];
    }
  }

  /**
   * Get completion count for a specific exercise
   */
  async getExerciseCompletionCount(exerciseId: string): Promise<number> {
    try {
      const completions = await this.getCompletions();
      return completions.filter(c => c.exerciseId === exerciseId).length;
    } catch (error) {
      console.error('Error counting completions:', error);
      return 0;
    }
  }

  /**
   * Get total exercise completions
   */
  async getTotalCompletions(): Promise<number> {
    try {
      const completions = await this.getCompletions();
      return completions.length;
    } catch (error) {
      console.error('Error counting total completions:', error);
      return 0;
    }
  }

  /**
   * Get recent completions
   */
  async getRecentCompletions(limit: number = 10): Promise<ExerciseCompletion[]> {
    try {
      const completions = await this.getCompletions();
      return completions
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    } catch (error) {
      console.error('Error loading recent completions:', error);
      return [];
    }
  }

  /**
   * Get average helpfulness rating for an exercise
   */
  async getAverageHelpfulness(exerciseId: string): Promise<number> {
    try {
      const completions = await this.getCompletions();
      const exerciseCompletions = completions.filter(c => c.exerciseId === exerciseId);
      
      if (exerciseCompletions.length === 0) return 0;
      
      const sum = exerciseCompletions.reduce((total, c) => total + c.helpfulness, 0);
      return sum / exerciseCompletions.length;
    } catch (error) {
      console.error('Error calculating average helpfulness:', error);
      return 0;
    }
  }

  /**
   * Clear all completions
   */
  async clearCompletions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(COMPLETIONS_KEY);
    } catch (error) {
      console.error('Error clearing completions:', error);
      throw error;
    }
  }
}

export const exerciseService = new ExerciseService();
