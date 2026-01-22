import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { notificationService, type NotificationPreferences } from '@/lib/notifications';
import { exportService } from '@/lib/export';
import { biometricAuth, type BiometricCapabilities } from '@/lib/biometric-auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY_STORAGE = '@mindspace_openrouter_key';

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState('');
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    enabled: true,
    moodReminders: true,
    moodReminderTime: '20:00',
    therapyReminders: true,
    motivationalMessages: true,
    motivationalFrequency: 'daily',
    crisisAlerts: true,
  });
  const [hasPermission, setHasPermission] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricCapabilities, setBiometricCapabilities] = useState<BiometricCapabilities>({
    isAvailable: false,
    isEnrolled: false,
    supportedTypes: [],
    biometricName: 'Biometric',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedKey = await AsyncStorage.getItem(API_KEY_STORAGE);
      if (savedKey) setApiKey(savedKey);

      const prefs = await notificationService.getPreferences();
      setNotifPrefs(prefs);

      const capabilities = await biometricAuth.checkCapabilities();
      setBiometricCapabilities(capabilities);

      const enabled = await biometricAuth.isEnabled();
      setBiometricEnabled(enabled);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveApiKey = async () => {
    try {
      await AsyncStorage.setItem(API_KEY_STORAGE, apiKey);
      Alert.alert('Success', 'API key saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save API key');
    }
  };

  const requestNotificationPermission = async () => {
    const granted = await notificationService.requestPermissions();
    setHasPermission(granted);
    
    if (granted) {
      Alert.alert('Success', 'Notification permissions granted');
      await notificationService.scheduleAllNotifications();
    } else {
      Alert.alert('Permission Denied', 'Please enable notifications in your device settings');
    }
  };

  const updateNotificationPref = async (key: keyof NotificationPreferences, value: any) => {
    const newPrefs = { ...notifPrefs, [key]: value };
    setNotifPrefs(newPrefs);
    
    try {
      await notificationService.updatePreferences({ [key]: value });
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification preferences');
    }
  };

  const exportMoodHistory = async () => {
    try {
      Alert.alert('Exporting', 'Generating PDF...');
      const uri = await exportService.exportMoodHistory();
      await exportService.shareFile(uri);
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export mood history');
    }
  };

  const exportJournalEntries = async () => {
    try {
      Alert.alert('Exporting', 'Generating PDF...');
      const uri = await exportService.exportJournalEntries();
      await exportService.shareFile(uri);
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export journal entries');
    }
  };

  const exportProgressReport = async () => {
    try {
      Alert.alert('Exporting', 'Generating PDF...');
      const uri = await exportService.exportProgressReport();
      await exportService.shareFile(uri);
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export progress report');
    }
  };

  const exportAllData = async () => {
    try {
      Alert.alert('Exporting', 'Generating comprehensive PDF report...');
      const uri = await exportService.exportAllData();
      await exportService.shareFile(uri);
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export all data');
    }
  };

  const toggleBiometric = async (value: boolean) => {
    try {
      if (value) {
        // Enable biometric
        const success = await biometricAuth.enable();
        if (success) {
          setBiometricEnabled(true);
          Alert.alert('Success', `${biometricCapabilities.biometricName} authentication enabled`);
        } else {
          Alert.alert('Failed', 'Could not enable biometric authentication');
        }
      } else {
        // Disable biometric
        await biometricAuth.disable();
        setBiometricEnabled(false);
        Alert.alert('Disabled', `${biometricCapabilities.biometricName} authentication disabled`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to toggle biometric authentication');
    }
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your mood entries, journal entries, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'All data has been cleared');
              loadSettings();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Settings</Text>
          <Text className="text-base text-muted">
            Customize your MindSpace experience
          </Text>
        </View>

        {/* API Configuration */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-foreground mb-4">AI Configuration</Text>
          
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <Text className="text-sm font-semibold text-foreground mb-2">
              OpenRouter API Key
            </Text>
            <Text className="text-xs text-muted mb-3">
              Get your API key from openrouter.ai
            </Text>
            
            <TextInput
              className="bg-background border border-border rounded-xl p-3 text-foreground mb-3"
              placeholder="sk-or-..."
              placeholderTextColor="#9BA1A6"
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry
            />
            
            <TouchableOpacity
              className="bg-primary py-3 rounded-xl items-center"
              onPress={saveApiKey}
              activeOpacity={0.8}
            >
              <Text className="text-background font-semibold">Save API Key</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notification Settings */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-foreground mb-4">Notifications</Text>
          
          {/* Permission Request */}
          {!hasPermission && (
            <TouchableOpacity
              className="bg-primary py-4 rounded-xl items-center mb-4"
              onPress={requestNotificationPermission}
              activeOpacity={0.8}
            >
              <Text className="text-background font-semibold">Enable Notifications</Text>
            </TouchableOpacity>
          )}

          <View className="bg-surface rounded-2xl p-5 border border-border mb-3">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  All Notifications
                </Text>
                <Text className="text-xs text-muted">
                  Master switch for all notifications
                </Text>
              </View>
              <Switch
                value={notifPrefs.enabled}
                onValueChange={(value) => updateNotificationPref('enabled', value)}
                trackColor={{ false: '#E5E7EB', true: '#6B9BD1' }}
              />
            </View>

            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  Mood Reminders
                </Text>
                <Text className="text-xs text-muted">
                  Daily reminder to log your mood
                </Text>
              </View>
              <Switch
                value={notifPrefs.moodReminders}
                onValueChange={(value) => updateNotificationPref('moodReminders', value)}
                trackColor={{ false: '#E5E7EB', true: '#6B9BD1' }}
                disabled={!notifPrefs.enabled}
              />
            </View>

            {notifPrefs.moodReminders && (
              <View className="mb-4 ml-4">
                <Text className="text-sm text-muted mb-2">Reminder Time</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl p-3 text-foreground"
                  placeholder="20:00"
                  value={notifPrefs.moodReminderTime}
                  onChangeText={(value) => updateNotificationPref('moodReminderTime', value)}
                />
              </View>
            )}

            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  Therapy Reminders
                </Text>
                <Text className="text-xs text-muted">
                  Reminders for scheduled sessions
                </Text>
              </View>
              <Switch
                value={notifPrefs.therapyReminders}
                onValueChange={(value) => updateNotificationPref('therapyReminders', value)}
                trackColor={{ false: '#E5E7EB', true: '#6B9BD1' }}
                disabled={!notifPrefs.enabled}
              />
            </View>

            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  Motivational Messages
                </Text>
                <Text className="text-xs text-muted">
                  Positive affirmations and encouragement
                </Text>
              </View>
              <Switch
                value={notifPrefs.motivationalMessages}
                onValueChange={(value) => updateNotificationPref('motivationalMessages', value)}
                trackColor={{ false: '#E5E7EB', true: '#6B9BD1' }}
                disabled={!notifPrefs.enabled}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  Crisis Alerts
                </Text>
                <Text className="text-xs text-muted">
                  Important crisis support notifications
                </Text>
              </View>
              <Switch
                value={notifPrefs.crisisAlerts}
                onValueChange={(value) => updateNotificationPref('crisisAlerts', value)}
                trackColor={{ false: '#E5E7EB', true: '#6B9BD1' }}
                disabled={!notifPrefs.enabled}
              />
            </View>
          </View>
        </View>

        {/* Export Data */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-foreground mb-4">Export Data</Text>
          
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <Text className="text-sm text-muted mb-4">
              Export your data as PDF to share with your therapist or keep for your records.
            </Text>
            
            <TouchableOpacity
              className="bg-primary py-3 rounded-xl items-center mb-3"
              onPress={exportMoodHistory}
              activeOpacity={0.8}
            >
              <Text className="text-background font-semibold">📊 Export Mood History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="bg-primary py-3 rounded-xl items-center mb-3"
              onPress={exportJournalEntries}
              activeOpacity={0.8}
            >
              <Text className="text-background font-semibold">📝 Export Journal Entries</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="bg-primary py-3 rounded-xl items-center mb-3"
              onPress={exportProgressReport}
              activeOpacity={0.8}
            >
              <Text className="text-background font-semibold">📈 Export Progress Report</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="bg-primary py-3 rounded-xl items-center"
              onPress={exportAllData}
              activeOpacity={0.8}
            >
              <Text className="text-background font-semibold">📦 Export All Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-foreground mb-4">Security</Text>
          
          <View className="bg-surface rounded-2xl p-5 border border-border">
            {biometricCapabilities.isAvailable && biometricCapabilities.isEnrolled ? (
              <>
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      {biometricCapabilities.biometricName} Lock
                    </Text>
                    <Text className="text-xs text-muted">
                      Require {biometricCapabilities.biometricName} to open the app
                    </Text>
                  </View>
                  <Switch
                    value={biometricEnabled}
                    onValueChange={toggleBiometric}
                    trackColor={{ false: '#E5E7EB', true: '#6B9BD1' }}
                  />
                </View>
              </>
            ) : (
              <Text className="text-sm text-muted">
                {!biometricCapabilities.isAvailable
                  ? 'Biometric authentication is not available on this device'
                  : 'No biometric data enrolled. Please set up biometric authentication in your device settings'}
              </Text>
            )}
          </View>
        </View>

        {/* Privacy & Data */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-foreground mb-4">Privacy & Data</Text>
          
          <View className="bg-surface rounded-2xl p-5 border border-border mb-3">
            <Text className="text-sm text-muted mb-4">
              All your data is stored locally on your device and encrypted for your privacy.
            </Text>
            
            <TouchableOpacity
              className="bg-error py-3 rounded-xl items-center"
              onPress={clearAllData}
              activeOpacity={0.8}
            >
              <Text className="text-background font-semibold">Clear All Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-foreground mb-4">About</Text>
          
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <Text className="text-base font-semibold text-foreground mb-2">
              MindSpace
            </Text>
            <Text className="text-sm text-muted mb-4">
              Version 1.0.0
            </Text>
            <Text className="text-xs text-muted leading-relaxed">
              MindSpace is an AI-assisted mental health therapy app designed to support your wellness journey. 
              This app is not a replacement for professional mental health care. If you're experiencing a mental 
              health crisis, please contact emergency services or a crisis hotline immediately.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
