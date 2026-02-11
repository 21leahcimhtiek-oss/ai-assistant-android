// Push Notifications Service
// Reminders, alerts, and crisis notifications across all apps

import * as Notifications from 'expo-notifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPayload {
  id: string;
  userId: number;
  appType: string;
  type: 'reminder' | 'alert' | 'crisis' | 'milestone' | 'appointment' | 'check_in';
  title: string;
  body: string;
  data?: Record<string, any>;
  scheduledTime?: Date;
  sent: boolean;
}

export interface NotificationSchedule {
  id: string;
  userId: number;
  appType: string;
  type: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'once';
  time: string; // HH:MM format
  enabled: boolean;
  createdAt: Date;
}

export class PushNotificationsService {
  async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  async getDeviceToken(): Promise<string | null> {
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (error) {
      console.error('Error getting device token:', error);
      return null;
    }
  }

  async sendNotification(payload: Omit<NotificationPayload, 'id' | 'sent'>): Promise<NotificationPayload> {
    const notification: NotificationPayload = {
      id: `notif_${Date.now()}`,
      ...payload,
      sent: false,
    };

    try {
      const deviceToken = await this.getDeviceToken();
      if (!deviceToken) {
        console.warn('No device token available');
        return notification;
      }

      // Send to Expo Notifications
      const trigger = payload.scheduledTime ? Math.max(1, Math.floor((payload.scheduledTime.getTime() - Date.now()) / 1000)) : null;
      if (trigger) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: payload.title,
            body: payload.body,
            data: payload.data || {},
            sound: 'default',
            badge: 1,
          },
          trigger: trigger as any,
        });
      } else {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: payload.title,
            body: payload.body,
            data: payload.data || {},
            sound: 'default',
            badge: 1,
          },
          trigger: 1 as any,
        });
      }

      notification.sent = true;
    } catch (error) {
      console.error('Error sending notification:', error);
    }

    return notification;
  }

  async scheduleReminder(userId: number, appType: string, title: string, body: string, time: string): Promise<NotificationSchedule> {
    const schedule: NotificationSchedule = {
      id: `schedule_${Date.now()}`,
      userId,
      appType,
      type: 'reminder',
      frequency: 'daily',
      time,
      enabled: true,
      createdAt: new Date(),
    };

    // TODO: Save to database
    // TODO: Set up recurring notification

    return schedule;
  }

  async sendAppointmentReminder(userId: number, appType: string, therapistName: string, appointmentTime: Date): Promise<NotificationPayload> {
    const timeUntilAppointment = appointmentTime.getTime() - Date.now();
    const hoursUntil = Math.floor(timeUntilAppointment / (1000 * 60 * 60));

    return this.sendNotification({
      userId,
      appType,
      type: 'appointment',
      title: 'Upcoming Appointment',
      body: `Your session with ${therapistName} is in ${hoursUntil} hours`,
      data: {
        appointmentTime: appointmentTime.toISOString(),
        therapistName,
      },
      scheduledTime: new Date(appointmentTime.getTime() - 60 * 60 * 1000), // 1 hour before
    });
  }

  async sendDailyCheckIn(userId: number, appType: string): Promise<NotificationPayload> {
    const checkInMessages: Record<string, string> = {
      traumaheal: 'How are you feeling today? Take a moment to check in with yourself.',
      mindspace: 'Time for your daily mood check-in. How are you feeling?',
      relationshipai: 'How is your relationship today? Consider reaching out to your partner.',
      anxietycalm: 'Remember your breathing techniques. Take a moment to breathe deeply.',
      moodlift: 'What activity can you do today to lift your mood?',
      addictionfree: 'You are doing great! Celebrate another day of recovery.',
      griefcompanion: 'Take time to remember and honor your loved one today.',
      childmind: 'Check in with your child about their day and feelings.',
      sleepwell: 'Prepare for a good night sleep. Start your bedtime routine.',
      stressrelief: 'Take a moment to relax and manage your stress.',
    };

    return this.sendNotification({
      userId,
      appType,
      type: 'check_in',
      title: 'Daily Check-In',
      body: checkInMessages[appType] || 'Time for your daily check-in',
    });
  }

  async sendMilestoneNotification(userId: number, appType: string, milestone: string): Promise<NotificationPayload> {
    const milestoneMessages: Record<string, string> = {
      traumaheal: `Congratulations! You have reached a ${milestone} milestone in your trauma recovery journey!`,
      addictionfree: `Amazing! You have achieved ${milestone} of sobriety! Keep up the great work!`,
      griefcompanion: `You have taken an important step in your grief journey. Celebrate this ${milestone} milestone.`,
      sleepwell: `Great progress! You have improved your sleep for ${milestone}. Keep it up!`,
      stressrelief: `Wonderful! You have been managing stress consistently for ${milestone}!`,
    };

    return this.sendNotification({
      userId,
      appType,
      type: 'milestone',
      title: 'Milestone Achieved!',
      body: milestoneMessages[appType] || `Congratulations on reaching ${milestone}!`,
      data: { milestone },
    });
  }

  async sendCrisisAlert(userId: number, appType: string): Promise<NotificationPayload> {
    return this.sendNotification({
      userId,
      appType,
      type: 'crisis',
      title: 'Crisis Support Available',
      body: 'We are here for you. Connect with a crisis counselor now.',
      data: {
        crisisResources: [
          { name: 'National Suicide Prevention Lifeline', number: '988' },
          { name: 'Crisis Text Line', text: 'HOME to 741741' },
          { name: 'International Association for Suicide Prevention', url: 'https://www.iasp.info/resources/Crisis_Centres/' },
        ],
      },
    });
  }

  async createNotificationSchedule(userId: number, appType: string, type: string, frequency: string, time: string): Promise<NotificationSchedule> {
    const schedule: NotificationSchedule = {
      id: `schedule_${Date.now()}`,
      userId,
      appType,
      type,
      frequency: frequency as 'daily' | 'weekly' | 'monthly' | 'once',
      time,
      enabled: true,
      createdAt: new Date(),
    };

    // TODO: Save to database
    // TODO: Set up recurring notification based on frequency

    return schedule;
  }

  async disableNotifications(userId: number, appType: string): Promise<void> {
    // TODO: Disable all notifications for user in this app
  }

  async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    const { notification } = response;
    const { data } = notification.request.content;

    // Handle different notification types
    if (data.type === 'crisis') {
      // Route to crisis resources
      console.log('Crisis notification tapped');
    } else if (data.type === 'appointment') {
      // Route to appointment details
      console.log('Appointment notification tapped');
    } else if (data.type === 'milestone') {
      // Route to achievements
      console.log('Milestone notification tapped');
    }
  }
}

export default new PushNotificationsService();
