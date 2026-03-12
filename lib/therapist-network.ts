import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Therapist {
  id: string;
  name: string;
  credentials: string[]; // e.g., ["PhD", "Licensed Clinical Psychologist", "CBT Certified"]
  specialties: string[]; // e.g., ["Anxiety", "Depression", "Trauma", "CBT"]
  bio: string;
  yearsExperience: number;
  photo?: string;
  rating: number; // 0-5
  reviewCount: number;
  acceptsInsurance: boolean;
  insuranceProviders: string[];
  sessionRate: number; // per hour
  availability: TherapistAvailability[];
  languages: string[];
  location: string;
  teletherapyAvailable: boolean;
  verified: boolean;
}

export interface TherapistAvailability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // "09:00"
  endTime: string; // "17:00"
}

export interface Session {
  id: string;
  therapistId: string;
  userId: string;
  scheduledTime: number;
  duration: number; // minutes
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  type: 'video' | 'phone' | 'in-person';
  notes?: string;
  sessionNotes?: string; // Therapist's notes (private)
  cost: number;
  paid: boolean;
}

export interface ProgressReport {
  id: string;
  userId: string;
  therapistId?: string;
  generatedAt: number;
  period: {
    start: number;
    end: number;
  };
  data: {
    moodTrend: any;
    journalCount: number;
    exerciseCount: number;
    sessionCount: number;
    wellnessScore: number;
    insights: string[];
  };
  sharedWith: string[]; // therapist IDs
}

const THERAPISTS_KEY = '@mindspace_therapists';
const SESSIONS_KEY = '@mindspace_sessions';
const REPORTS_KEY = '@mindspace_reports';

// Sample therapist data (in production, this would come from an API)
const SAMPLE_THERAPISTS: Therapist[] = [
  {
    id: 'therapist_1',
    name: 'Dr. Sarah Johnson',
    credentials: ['PhD', 'Licensed Clinical Psychologist', 'CBT Certified'],
    specialties: ['Anxiety', 'Depression', 'CBT', 'Mindfulness'],
    bio: 'Dr. Johnson specializes in cognitive behavioral therapy with over 15 years of experience helping clients manage anxiety and depression. She uses evidence-based techniques tailored to each individual.',
    yearsExperience: 15,
    rating: 4.9,
    reviewCount: 127,
    acceptsInsurance: true,
    insuranceProviders: ['Blue Cross', 'Aetna', 'Cigna', 'UnitedHealthcare'],
    sessionRate: 150,
    availability: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
    ],
    languages: ['English', 'Spanish'],
    location: 'New York, NY',
    teletherapyAvailable: true,
    verified: true,
  },
  {
    id: 'therapist_2',
    name: 'Dr. Michael Chen',
    credentials: ['MD', 'Board Certified Psychiatrist', 'Trauma Specialist'],
    specialties: ['PTSD', 'Trauma', 'Medication Management', 'EMDR'],
    bio: 'Dr. Chen is a board-certified psychiatrist specializing in trauma-focused therapy and medication management. He combines evidence-based psychotherapy with psychiatric care.',
    yearsExperience: 12,
    rating: 4.8,
    reviewCount: 89,
    acceptsInsurance: true,
    insuranceProviders: ['Medicare', 'Medicaid', 'Blue Cross', 'Aetna'],
    sessionRate: 200,
    availability: [
      { dayOfWeek: 1, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 3, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 5, startTime: '10:00', endTime: '16:00' },
    ],
    languages: ['English', 'Mandarin'],
    location: 'San Francisco, CA',
    teletherapyAvailable: true,
    verified: true,
  },
  {
    id: 'therapist_3',
    name: 'Dr. Emily Rodriguez',
    credentials: ['PsyD', 'Licensed Marriage & Family Therapist', 'DBT Trained'],
    specialties: ['Relationships', 'Couples Therapy', 'DBT', 'Emotional Regulation'],
    bio: 'Dr. Rodriguez specializes in relationship counseling and dialectical behavior therapy. She helps individuals and couples develop healthier communication and emotional regulation skills.',
    yearsExperience: 10,
    rating: 4.9,
    reviewCount: 156,
    acceptsInsurance: true,
    insuranceProviders: ['Blue Cross', 'Cigna', 'UnitedHealthcare'],
    sessionRate: 140,
    availability: [
      { dayOfWeek: 2, startTime: '12:00', endTime: '20:00' },
      { dayOfWeek: 4, startTime: '12:00', endTime: '20:00' },
      { dayOfWeek: 6, startTime: '09:00', endTime: '15:00' },
    ],
    languages: ['English', 'Spanish'],
    location: 'Austin, TX',
    teletherapyAvailable: true,
    verified: true,
  },
  {
    id: 'therapist_4',
    name: 'Dr. James Williams',
    credentials: ['PhD', 'Licensed Clinical Psychologist', 'Addiction Specialist'],
    specialties: ['Addiction', 'Substance Abuse', 'Dual Diagnosis', 'Motivational Interviewing'],
    bio: 'Dr. Williams has dedicated his career to helping individuals overcome addiction and substance abuse. He uses evidence-based approaches including CBT, DBT, and motivational interviewing.',
    yearsExperience: 18,
    rating: 4.9,
    reviewCount: 203,
    acceptsInsurance: true,
    insuranceProviders: ['Blue Cross', 'Aetna', 'Cigna', 'Medicare', 'Medicaid'],
    sessionRate: 160,
    availability: [
      { dayOfWeek: 1, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 2, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 3, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 4, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 5, startTime: '08:00', endTime: '14:00' },
    ],
    languages: ['English'],
    location: 'Chicago, IL',
    teletherapyAvailable: true,
    verified: true,
  },
  {
    id: 'therapist_5',
    name: 'Dr. Aisha Patel',
    credentials: ['MD', 'Board Certified Psychiatrist', 'Child & Adolescent Specialist'],
    specialties: ['Child Therapy', 'Adolescent Mental Health', 'ADHD', 'Autism Spectrum'],
    bio: 'Dr. Patel specializes in child and adolescent psychiatry with expertise in ADHD, autism spectrum disorders, and developmental challenges. She works closely with families to create comprehensive treatment plans.',
    yearsExperience: 14,
    rating: 5.0,
    reviewCount: 178,
    acceptsInsurance: true,
    insuranceProviders: ['Blue Cross', 'UnitedHealthcare', 'Aetna', 'Cigna'],
    sessionRate: 180,
    availability: [
      { dayOfWeek: 1, startTime: '14:00', endTime: '19:00' },
      { dayOfWeek: 3, startTime: '14:00', endTime: '19:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 6, startTime: '10:00', endTime: '14:00' },
    ],
    languages: ['English', 'Hindi', 'Gujarati'],
    location: 'Seattle, WA',
    teletherapyAvailable: true,
    verified: true,
  },
  {
    id: 'therapist_6',
    name: 'Dr. Marcus Thompson',
    credentials: ['PsyD', 'Licensed Psychologist', 'Trauma & PTSD Specialist'],
    specialties: ['PTSD', 'Military & Veterans', 'First Responders', 'Complex Trauma'],
    bio: 'Dr. Thompson specializes in trauma therapy for military veterans and first responders. He uses evidence-based treatments including EMDR, CPT, and prolonged exposure therapy.',
    yearsExperience: 20,
    rating: 4.9,
    reviewCount: 245,
    acceptsInsurance: true,
    insuranceProviders: ['Tricare', 'VA', 'Blue Cross', 'UnitedHealthcare'],
    sessionRate: 170,
    availability: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
    ],
    languages: ['English'],
    location: 'Washington, DC',
    teletherapyAvailable: true,
    verified: true,
  },
  {
    id: 'therapist_7',
    name: 'Dr. Lisa Nguyen',
    credentials: ['PhD', 'Licensed Psychologist', 'Eating Disorder Specialist'],
    specialties: ['Eating Disorders', 'Body Image', 'Self-Esteem', 'Anxiety'],
    bio: 'Dr. Nguyen specializes in treating eating disorders including anorexia, bulimia, and binge eating disorder. She uses a compassionate, evidence-based approach focused on healing the relationship with food and body.',
    yearsExperience: 11,
    rating: 4.8,
    reviewCount: 134,
    acceptsInsurance: true,
    insuranceProviders: ['Blue Cross', 'Aetna', 'Cigna'],
    sessionRate: 155,
    availability: [
      { dayOfWeek: 2, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 3, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 4, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 6, startTime: '09:00', endTime: '13:00' },
    ],
    languages: ['English', 'Vietnamese'],
    location: 'Los Angeles, CA',
    teletherapyAvailable: true,
    verified: true,
  },
  {
    id: 'therapist_8',
    name: 'Dr. Robert Klein',
    credentials: ['MD', 'Board Certified Psychiatrist', 'Geriatric Psychiatry'],
    specialties: ['Geriatric Mental Health', 'Depression', 'Dementia Care', 'Grief Counseling'],
    bio: 'Dr. Klein specializes in mental health care for older adults, including depression, anxiety, and cognitive disorders. He provides compassionate care for seniors and their families.',
    yearsExperience: 25,
    rating: 4.9,
    reviewCount: 167,
    acceptsInsurance: true,
    insuranceProviders: ['Medicare', 'Blue Cross', 'UnitedHealthcare', 'Aetna'],
    sessionRate: 190,
    availability: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '15:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '15:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '15:00' },
    ],
    languages: ['English', 'German'],
    location: 'Boston, MA',
    teletherapyAvailable: true,
    verified: true,
  },
  {
    id: 'therapist_9',
    name: 'Dr. Carmen Diaz',
    credentials: ['LCSW', 'Licensed Clinical Social Worker', 'Bilingual Therapist'],
    specialties: ['Anxiety', 'Depression', 'Cultural Identity', 'Immigration Stress'],
    bio: 'Dr. Diaz provides culturally sensitive therapy for immigrant communities and individuals navigating cultural identity issues. She specializes in anxiety, depression, and acculturation stress.',
    yearsExperience: 9,
    rating: 4.9,
    reviewCount: 112,
    acceptsInsurance: true,
    insuranceProviders: ['Medicaid', 'Blue Cross', 'UnitedHealthcare'],
    sessionRate: 120,
    availability: [
      { dayOfWeek: 1, startTime: '12:00', endTime: '20:00' },
      { dayOfWeek: 2, startTime: '12:00', endTime: '20:00' },
      { dayOfWeek: 4, startTime: '12:00', endTime: '20:00' },
      { dayOfWeek: 5, startTime: '12:00', endTime: '20:00' },
    ],
    languages: ['English', 'Spanish'],
    location: 'Miami, FL',
    teletherapyAvailable: true,
    verified: true,
  },
  {
    id: 'therapist_10',
    name: 'Dr. Kevin Park',
    credentials: ['PhD', 'Licensed Psychologist', 'OCD Specialist'],
    specialties: ['OCD', 'Anxiety Disorders', 'Exposure Therapy', 'ERP'],
    bio: 'Dr. Park is an expert in treating OCD and anxiety disorders using exposure and response prevention (ERP) therapy. He helps clients break free from compulsive behaviors and intrusive thoughts.',
    yearsExperience: 13,
    rating: 5.0,
    reviewCount: 189,
    acceptsInsurance: true,
    insuranceProviders: ['Blue Cross', 'Aetna', 'Cigna', 'UnitedHealthcare'],
    sessionRate: 165,
    availability: [
      { dayOfWeek: 1, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 3, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 5, startTime: '10:00', endTime: '18:00' },
    ],
    languages: ['English', 'Korean'],
    location: 'Denver, CO',
    teletherapyAvailable: true,
    verified: true,
  },
];

class TherapistNetworkService {
  /**
   * Get all verified therapists
   */
  async getAllTherapists(): Promise<Therapist[]> {
    try {
      // In production, this would fetch from an API
      const data = await AsyncStorage.getItem(THERAPISTS_KEY);
      return data ? JSON.parse(data) : SAMPLE_THERAPISTS;
    } catch (error) {
      console.error('Error loading therapists:', error);
      return SAMPLE_THERAPISTS;
    }
  }

  /**
   * Search therapists by specialty
   */
  async searchTherapists(filters: {
    specialty?: string;
    acceptsInsurance?: boolean;
    maxRate?: number;
    teletherapyOnly?: boolean;
    language?: string;
  }): Promise<Therapist[]> {
    try {
      let therapists = await this.getAllTherapists();

      if (filters.specialty) {
        therapists = therapists.filter(therapist =>
          therapist.specialties.some(specialty =>
            specialty.toLowerCase().includes(filters.specialty!.toLowerCase())
          )
        );
      }

      if (filters.acceptsInsurance !== undefined) {
        therapists = therapists.filter(
          therapist => therapist.acceptsInsurance === filters.acceptsInsurance
        );
      }

      if (filters.maxRate) {
        therapists = therapists.filter(therapist => therapist.sessionRate <= filters.maxRate!);
      }

      if (filters.teletherapyOnly) {
        therapists = therapists.filter(therapist => therapist.teletherapyAvailable);
      }

      if (filters.language) {
        therapists = therapists.filter(therapist =>
          therapist.languages.some(
            language => language.toLowerCase() === filters.language!.toLowerCase()
          )
        );
      }

      return therapists;
    } catch (error) {
      console.error('Error searching therapists:', error);
      return [];
    }
  }

  /**
   * Get a specific therapist
   */
  async getTherapist(id: string): Promise<Therapist | null> {
    try {
      const therapists = await this.getAllTherapists();
      return therapists.find(therapist => therapist.id === id) || null;
    } catch (error) {
      console.error('Error loading therapist:', error);
      return null;
    }
  }

  /**
   * Book a session with a therapist
   */
  async bookSession(session: Omit<Session, 'id'>): Promise<Session> {
    try {
      const newSession: Session = {
        ...session,
        id: `session_${Date.now()}`,
      };

      const sessions = await this.getAllSessions();
      sessions.push(newSession);
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));

      return newSession;
    } catch (error) {
      console.error('Error booking session:', error);
      throw error;
    }
  }

  /**
   * Get all sessions for the user
   */
  async getAllSessions(): Promise<Session[]> {
    try {
      const data = await AsyncStorage.getItem(SESSIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  }

  /**
   * Get upcoming sessions
   */
  async getUpcomingSessions(): Promise<Session[]> {
    try {
      const sessions = await this.getAllSessions();
      const now = Date.now();
      return sessions
        .filter(s => s.scheduledTime > now && s.status === 'scheduled')
        .sort((a, b) => a.scheduledTime - b.scheduledTime);
    } catch (error) {
      console.error('Error loading upcoming sessions:', error);
      return [];
    }
  }

  /**
   * Cancel a session
   */
  async cancelSession(sessionId: string): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      const index = sessions.findIndex(s => s.id === sessionId);
      if (index >= 0) {
        sessions[index].status = 'cancelled';
        await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('Error cancelling session:', error);
      throw error;
    }
  }

  /**
   * Generate and save a progress report
   */
  async generateProgressReport(
    data: ProgressReport['data'],
    period: ProgressReport['period']
  ): Promise<ProgressReport> {
    try {
      const report: ProgressReport = {
        id: `report_${Date.now()}`,
        userId: 'current_user', // In production, get from auth
        generatedAt: Date.now(),
        period,
        data,
        sharedWith: [],
      };

      const reports = await this.getAllReports();
      reports.push(report);
      await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(reports));

      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Share progress report with therapist
   */
  async shareReportWithTherapist(reportId: string, therapistId: string): Promise<void> {
    try {
      const reports = await this.getAllReports();
      const index = reports.findIndex(r => r.id === reportId);
      if (index >= 0) {
        if (!reports[index].sharedWith.includes(therapistId)) {
          reports[index].sharedWith.push(therapistId);
          await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
        }
      }
    } catch (error) {
      console.error('Error sharing report:', error);
      throw error;
    }
  }

  /**
   * Get all progress reports
   */
  async getAllReports(): Promise<ProgressReport[]> {
    try {
      const data = await AsyncStorage.getItem(REPORTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading reports:', error);
      return [];
    }
  }

  /**
   * Get therapist specialties (for filtering)
   */
  getCommonSpecialties(): string[] {
    return [
      'Anxiety',
      'Depression',
      'Trauma & PTSD',
      'Relationships',
      'Grief & Loss',
      'Addiction',
      'Eating Disorders',
      'OCD',
      'Bipolar Disorder',
      'ADHD',
      'Stress Management',
      'Life Transitions',
      'Self-Esteem',
      'Anger Management',
    ];
  }

  /**
   * Get insurance providers
   */
  getInsuranceProviders(): string[] {
    return [
      'Aetna',
      'Blue Cross Blue Shield',
      'Cigna',
      'UnitedHealthcare',
      'Medicare',
      'Medicaid',
      'Humana',
      'Kaiser Permanente',
      'Anthem',
      'Tricare',
    ];
  }
}

export const therapistNetwork = new TherapistNetworkService();
