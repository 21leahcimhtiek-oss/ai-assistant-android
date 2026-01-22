import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPreferences {
  enabled: boolean;
  moodReminders: boolean;
  moodReminderTime: string; // HH:MM format
  therapyReminders: boolean;
  motivationalMessages: boolean;
  motivationalFrequency: 'daily' | 'twice_daily' | 'weekly';
  crisisAlerts: boolean;
}

const PREFS_KEY = '@mindspace_notification_prefs';
const TOKEN_KEY = '@mindspace_push_token';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  moodReminders: true,
  moodReminderTime: '20:00', // 8 PM default
  therapyReminders: true,
  motivationalMessages: true,
  motivationalFrequency: 'daily',
  crisisAlerts: true,
};

class NotificationService {
  /**
   * Request notification permissions from the user
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.log('Push notifications not supported on web');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      // Get push token for remote notifications
      const token = await Notifications.getExpoPushTokenAsync();
      await AsyncStorage.setItem(TOKEN_KEY, token.data);
      console.log('Push token:', token.data);

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const prefs = await AsyncStorage.getItem(PREFS_KEY);
      return prefs ? JSON.parse(prefs) : DEFAULT_PREFERENCES;
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      const currentPrefs = await this.getPreferences();
      const newPrefs = { ...currentPrefs, ...preferences };
      await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));

      // Reschedule notifications based on new preferences
      await this.scheduleAllNotifications();
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Schedule daily mood check-in reminder
   */
  async scheduleMoodReminder(): Promise<void> {
    const prefs = await this.getPreferences();
    
    if (!prefs.enabled || !prefs.moodReminders) {
      await Notifications.cancelScheduledNotificationAsync('mood-reminder');
      return;
    }

    const [hours, minutes] = prefs.moodReminderTime.split(':').map(Number);

    await Notifications.cancelScheduledNotificationAsync('mood-reminder');
    await Notifications.scheduleNotificationAsync({
      identifier: 'mood-reminder',
      content: {
        title: '💙 Daily Check-in',
        body: 'How are you feeling today? Take a moment to log your mood.',
        data: { type: 'mood_reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
  }

  /**
   * Schedule therapy session reminder
   */
  async scheduleTherapyReminder(sessionDate: Date, therapistName: string): Promise<string> {
    const prefs = await this.getPreferences();
    
    if (!prefs.enabled || !prefs.therapyReminders) {
      return '';
    }

    // Schedule reminder 1 hour before session
    const reminderTime = new Date(sessionDate.getTime() - 60 * 60 * 1000);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '👨‍⚕️ Therapy Session Reminder',
        body: `Your session with ${therapistName} starts in 1 hour.`,
        data: { type: 'therapy_reminder', sessionDate: sessionDate.toISOString() },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderTime },
    });

    return notificationId;
  }

  /**
   * Schedule motivational messages
   */
  async scheduleMotivationalMessages(): Promise<void> {
    const prefs = await this.getPreferences();
    
    if (!prefs.enabled || !prefs.motivationalMessages) {
      await Notifications.cancelScheduledNotificationAsync('motivational-morning');
      await Notifications.cancelScheduledNotificationAsync('motivational-evening');
      return;
    }

    const messages = [
      'You are stronger than you think. Keep going! 💪',
      'Every small step forward is progress. Be proud of yourself! 🌟',
      'It\'s okay to have difficult days. Tomorrow is a new opportunity. 🌅',
      'You deserve kindness, especially from yourself. 💙',
      'Your feelings are valid. Take time to care for yourself today. 🌸',
      'Progress, not perfection. You\'re doing great! ✨',
      'Remember: this feeling is temporary. You\'ve got this! 🌈',
    ];

    const getRandomMessage = () => messages[Math.floor(Math.random() * messages.length)];

    // Morning message (9 AM)
    await Notifications.cancelScheduledNotificationAsync('motivational-morning');
    await Notifications.scheduleNotificationAsync({
      identifier: 'motivational-morning',
      content: {
        title: '🌅 Good Morning',
        body: getRandomMessage(),
        data: { type: 'motivational' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: 9,
        minute: 0,
        repeats: prefs.motivationalFrequency !== 'weekly',
      },
    });

    // Evening message (8 PM) - only if twice daily
    if (prefs.motivationalFrequency === 'twice_daily') {
      await Notifications.cancelScheduledNotificationAsync('motivational-evening');
      await Notifications.scheduleNotificationAsync({
        identifier: 'motivational-evening',
        content: {
          title: '🌙 Evening Reflection',
          body: getRandomMessage(),
          data: { type: 'motivational' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: 20,
          minute: 0,
          repeats: true,
        },
      });
    }
  }

  /**
   * Send immediate crisis alert notification
   */
  async sendCrisisAlert(): Promise<void> {
    const prefs = await this.getPreferences();
    
    if (!prefs.enabled || !prefs.crisisAlerts) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🆘 Crisis Support Available',
        body: 'If you\'re in crisis, help is available 24/7. Tap to access resources.',
        data: { type: 'crisis_alert', route: '/crisis' },
      },
      trigger: null, // Send immediately
    });
  }

  /**
   * Schedule all enabled notifications
   */
  async scheduleAllNotifications(): Promise<void> {
    const prefs = await this.getPreferences();

    if (!prefs.enabled) {
      await this.cancelAllNotifications();
      return;
    }

    await this.scheduleMoodReminder();
    await this.scheduleMotivationalMessages();
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get all scheduled notifications (for debugging)
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Handle notification tap/interaction
   */
  addNotificationResponseListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }
}

export const notificationService = new NotificationService();
