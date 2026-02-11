// Video Teletherapy Service - Professional Therapist Video Connections
// Handles scheduling, video calls, and session recording

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Therapist {
  id: string;
  name: string;
  specialization: string[];
  credentials: string;
  licenseNumber: string;
  yearsExperience: number;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  availability: TimeSlot[];
  bio: string;
  profileImage: string;
  verified: boolean;
  acceptingPatients: boolean;
}

export interface TimeSlot {
  dayOfWeek: number; // 0-6
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  available: boolean;
}

export interface VideoSession {
  id: string;
  therapistId: string;
  therapistName: string;
  clientId: string;
  scheduledTime: number;
  duration: number; // minutes
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  videoUrl?: string;
  recordingUrl?: string;
  notes: string;
  clientNotes: string;
  rating?: number;
  feedback?: string;
  cost: number;
  paymentStatus: 'pending' | 'completed' | 'refunded';
}

export interface TherapistBooking {
  therapistId: string;
  therapistName: string;
  selectedDate: number;
  selectedTime: string;
  duration: number;
  reason: string;
  notes: string;
}

export const VideoTeletherapyService = {
  // Get available therapists
  async getAvailableTherapists(
    specialization?: string,
    maxRate?: number
  ): Promise<Therapist[]> {
    try {
      const therapists = await AsyncStorage.getItem('available_therapists');
      let list: Therapist[] = therapists ? JSON.parse(therapists) : getMockTherapists();

      if (specialization) {
        list = list.filter(t =>
          t.specialization.some(s => s.toLowerCase().includes(specialization.toLowerCase()))
        );
      }

      if (maxRate) {
        list = list.filter(t => t.hourlyRate <= maxRate);
      }

      return list.sort((a, b) => b.rating - a.rating);
    } catch (error) {
      console.error('Error getting therapists:', error);
      return getMockTherapists();
    }
  },

  // Get therapist by ID
  async getTherapist(therapistId: string): Promise<Therapist | null> {
    try {
      const therapists = await this.getAvailableTherapists();
      return therapists.find(t => t.id === therapistId) || null;
    } catch (error) {
      console.error('Error getting therapist:', error);
      return null;
    }
  },

  // Search therapists
  async searchTherapists(query: string): Promise<Therapist[]> {
    try {
      const therapists = await this.getAvailableTherapists();
      const lowerQuery = query.toLowerCase();

      return therapists.filter(
        t =>
          t.name.toLowerCase().includes(lowerQuery) ||
          t.specialization.some(s => s.toLowerCase().includes(lowerQuery)) ||
          t.bio.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Error searching therapists:', error);
      return [];
    }
  },

  // Book a session with therapist
  async bookSession(booking: TherapistBooking): Promise<VideoSession> {
    try {
      const therapist = await this.getTherapist(booking.therapistId);
      if (!therapist) {
        throw new Error('Therapist not found');
      }

      const session: VideoSession = {
        id: `session_${Date.now()}`,
        therapistId: booking.therapistId,
        therapistName: booking.therapistName,
        clientId: 'current_user_id', // Would be actual user ID
        scheduledTime: booking.selectedDate,
        duration: booking.duration,
        status: 'scheduled',
        notes: booking.notes,
        clientNotes: booking.reason,
        cost: (therapist.hourlyRate / 60) * booking.duration,
        paymentStatus: 'pending',
      };

      // Save session
      await AsyncStorage.setItem(
        `video_session_${session.id}`,
        JSON.stringify(session)
      );

      // Add to therapist's schedule
      const bookings = await AsyncStorage.getItem('therapist_bookings');
      const bookingsList: VideoSession[] = bookings ? JSON.parse(bookings) : [];
      bookingsList.push(session);
      await AsyncStorage.setItem('therapist_bookings', JSON.stringify(bookingsList));

      return session;
    } catch (error) {
      console.error('Error booking session:', error);
      throw error;
    }
  },

  // Get booked sessions
  async getBookedSessions(): Promise<VideoSession[]> {
    try {
      const bookings = await AsyncStorage.getItem('therapist_bookings');
      return bookings ? JSON.parse(bookings) : [];
    } catch (error) {
      console.error('Error getting booked sessions:', error);
      return [];
    }
  },

  // Get session by ID
  async getSession(sessionId: string): Promise<VideoSession | null> {
    try {
      const session = await AsyncStorage.getItem(`video_session_${sessionId}`);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  // Update session status
  async updateSessionStatus(
    sessionId: string,
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  ): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (session) {
        session.status = status;
        if (status === 'completed') {
          session.recordingUrl = `https://recordings.traumaheal.app/${sessionId}.mp4`;
        }
        await AsyncStorage.setItem(`video_session_${sessionId}`, JSON.stringify(session));
      }
    } catch (error) {
      console.error('Error updating session status:', error);
    }
  },

  // Rate therapist session
  async rateSession(
    sessionId: string,
    rating: number,
    feedback: string
  ): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (session) {
        session.rating = rating;
        session.feedback = feedback;
        await AsyncStorage.setItem(`video_session_${sessionId}`, JSON.stringify(session));

        // Update therapist rating
        const therapist = await this.getTherapist(session.therapistId);
        if (therapist) {
          const oldTotal = therapist.rating * therapist.reviewCount;
          therapist.reviewCount += 1;
          therapist.rating = (oldTotal + rating) / therapist.reviewCount;
          // Save updated therapist
        }
      }
    } catch (error) {
      console.error('Error rating session:', error);
    }
  },

  // Cancel session
  async cancelSession(sessionId: string, reason: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (session) {
        session.status = 'cancelled';
        session.notes = reason;
        session.paymentStatus = 'refunded';
        await AsyncStorage.setItem(`video_session_${sessionId}`, JSON.stringify(session));
      }
    } catch (error) {
      console.error('Error cancelling session:', error);
    }
  },

  // Get therapist availability
  async getTherapistAvailability(therapistId: string): Promise<TimeSlot[]> {
    try {
      const therapist = await this.getTherapist(therapistId);
      return therapist?.availability || [];
    } catch (error) {
      console.error('Error getting availability:', error);
      return [];
    }
  },

  // Process payment
  async processPayment(
    sessionId: string,
    amount: number,
    paymentMethod: string
  ): Promise<{ success: boolean; transactionId?: string }> {
    try {
      // In production, this would integrate with Stripe
      const session = await this.getSession(sessionId);
      if (session) {
        session.paymentStatus = 'completed';
        await AsyncStorage.setItem(`video_session_${sessionId}`, JSON.stringify(session));
        return {
          success: true,
          transactionId: `txn_${Date.now()}`,
        };
      }
      return { success: false };
    } catch (error) {
      console.error('Error processing payment:', error);
      return { success: false };
    }
  },

  // Get session recording
  async getSessionRecording(sessionId: string): Promise<string | null> {
    try {
      const session = await this.getSession(sessionId);
      return session?.recordingUrl || null;
    } catch (error) {
      console.error('Error getting recording:', error);
      return null;
    }
  },

  // Export session notes for therapist
  async exportSessionNotes(sessionId: string): Promise<string> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) return '';

      const therapist = await this.getTherapist(session.therapistId);
      const date = new Date(session.scheduledTime);

      return `
THERAPY SESSION NOTES
=====================

Date: ${date.toLocaleDateString()}
Time: ${date.toLocaleTimeString()}
Duration: ${session.duration} minutes
Therapist: ${session.therapistName}
Client Notes: ${session.clientNotes}

SESSION NOTES:
${session.notes}

THERAPIST FEEDBACK:
${session.feedback || 'No feedback provided'}

Rating: ${session.rating ? `${session.rating}/5` : 'Not rated'}

---
This session was conducted via TraumaHeal Teletherapy
For privacy and security, please handle this document confidentially.
      `;
    } catch (error) {
      console.error('Error exporting notes:', error);
      return '';
    }
  },

  // Get upcoming sessions
  async getUpcomingSessions(): Promise<VideoSession[]> {
    try {
      const sessions = await this.getBookedSessions();
      const now = Date.now();
      return sessions
        .filter(s => s.scheduledTime > now && s.status === 'scheduled')
        .sort((a, b) => a.scheduledTime - b.scheduledTime);
    } catch (error) {
      console.error('Error getting upcoming sessions:', error);
      return [];
    }
  },

  // Get past sessions
  async getPastSessions(): Promise<VideoSession[]> {
    try {
      const sessions = await this.getBookedSessions();
      return sessions
        .filter(s => s.status === 'completed')
        .sort((a, b) => b.scheduledTime - a.scheduledTime);
    } catch (error) {
      console.error('Error getting past sessions:', error);
      return [];
    }
  },

  // Get session statistics
  async getSessionStatistics(): Promise<{
    totalSessions: number;
    completedSessions: number;
    upcomingSessions: number;
    totalSpent: number;
    averageRating: number;
  }> {
    try {
      const sessions = await this.getBookedSessions();
      const completed = sessions.filter(s => s.status === 'completed');
      const upcoming = sessions.filter(s => s.status === 'scheduled');

      const totalSpent = sessions.reduce((sum, s) => sum + s.cost, 0);
      const avgRating =
        completed.length > 0
          ? completed.reduce((sum, s) => sum + (s.rating || 0), 0) / completed.length
          : 0;

      return {
        totalSessions: sessions.length,
        completedSessions: completed.length,
        upcomingSessions: upcoming.length,
        totalSpent,
        averageRating: Math.round(avgRating * 10) / 10,
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      return {
        totalSessions: 0,
        completedSessions: 0,
        upcomingSessions: 0,
        totalSpent: 0,
        averageRating: 0,
      };
    }
  },
};

// Mock therapists for development
function getMockTherapists(): Therapist[] {
  return [
    {
      id: 'therapist_1',
      name: 'Dr. Sarah Johnson',
      specialization: ['PTSD', 'Trauma', 'EMDR'],
      credentials: 'Ph.D. Clinical Psychology',
      licenseNumber: 'CA-PSY-12345',
      yearsExperience: 15,
      rating: 4.9,
      reviewCount: 127,
      hourlyRate: 150,
      availability: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', available: true },
        { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', available: true },
        { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', available: true },
        { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', available: true },
        { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', available: true },
      ],
      bio: 'Specializing in trauma-focused cognitive behavioral therapy and EMDR. 15+ years of experience treating PTSD and complex trauma.',
      profileImage: 'https://example.com/therapist1.jpg',
      verified: true,
      acceptingPatients: true,
    },
    {
      id: 'therapist_2',
      name: 'Dr. Michael Chen',
      specialization: ['Complex Trauma', 'Dissociation', 'Somatic Experiencing'],
      credentials: 'M.D. Psychiatry',
      licenseNumber: 'NY-PSY-67890',
      yearsExperience: 12,
      rating: 4.8,
      reviewCount: 98,
      hourlyRate: 175,
      availability: [
        { dayOfWeek: 0, startTime: '10:00', endTime: '18:00', available: true },
        { dayOfWeek: 1, startTime: '10:00', endTime: '18:00', available: true },
        { dayOfWeek: 3, startTime: '10:00', endTime: '18:00', available: true },
        { dayOfWeek: 5, startTime: '10:00', endTime: '18:00', available: true },
      ],
      bio: 'Expert in complex trauma and dissociative disorders. Trained in somatic experiencing and trauma-sensitive yoga.',
      profileImage: 'https://example.com/therapist2.jpg',
      verified: true,
      acceptingPatients: true,
    },
    {
      id: 'therapist_3',
      name: 'Dr. Emily Rodriguez',
      specialization: ['Trauma', 'Anxiety', 'Depression'],
      credentials: 'LCSW, MSW',
      licenseNumber: 'TX-LCS-54321',
      yearsExperience: 8,
      rating: 4.7,
      reviewCount: 65,
      hourlyRate: 120,
      availability: [
        { dayOfWeek: 1, startTime: '14:00', endTime: '20:00', available: true },
        { dayOfWeek: 2, startTime: '14:00', endTime: '20:00', available: true },
        { dayOfWeek: 4, startTime: '14:00', endTime: '20:00', available: true },
        { dayOfWeek: 6, startTime: '10:00', endTime: '16:00', available: true },
      ],
      bio: 'Compassionate therapist with experience in trauma, anxiety, and depression. Specializes in working with diverse populations.',
      profileImage: 'https://example.com/therapist3.jpg',
      verified: true,
      acceptingPatients: true,
    },
  ];
}

export default VideoTeletherapyService;
