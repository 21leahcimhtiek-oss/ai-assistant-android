# Complete Therapy App Suite - Integration Guide

## Overview

This guide covers the three major integrations that power the 10-app therapy suite:
1. **OpenRouter AI Therapist** - Real AI-powered conversational therapy
2. **Push Notifications** - Reminders, alerts, and crisis notifications
3. **Cross-App Data Sync** - Unified user profiles and data sharing

---

## 1. OpenRouter AI Therapist Integration

### Setup

The OpenRouter API key is already configured via environment variables. The service is available at:
```
server/openrouter-therapist-service.ts
```

### Features

- **Real AI Responses**: Uses GPT-4 Turbo for high-quality therapy conversations
- **Crisis Detection**: Automatically detects crisis keywords and provides resources
- **App-Specific Prompts**: Each app has trauma-informed, evidence-based system prompts
- **Session Management**: Track conversation history and generate session summaries

### Usage

```typescript
import openRouterTherapist from '@/server/openrouter-therapist-service';

// Start a therapy session
const session = await openRouterTherapist.startSession(userId, 'traumaheal');

// Send a message to the AI therapist
const response = await openRouterTherapist.sendMessage(
  userId,
  'traumaheal',
  'I am having flashbacks about my trauma',
  session.messages
);

// Check if crisis was detected
if (response.crisisDetected) {
  console.log(`Crisis level: ${response.crisisLevel}`);
  // Route to crisis resources
}

// End session and get summary
const endedSession = await openRouterTherapist.endSession(session);
const summary = await openRouterTherapist.generateSessionSummary(endedSession);
```

### Crisis Detection

The service automatically detects these crisis keywords:
- suicide, kill myself, hurt myself, self harm, overdose
- die, death, end it all, cannot go on
- no point, hopeless, worthless, give up

When crisis is detected, the AI therapist provides crisis resources:
- National Suicide Prevention Lifeline: 988 (US)
- Crisis Text Line: Text HOME to 741741
- International Association for Suicide Prevention

### System Prompts by App

Each app has a specialized system prompt:

| App | Focus | Techniques |
|-----|-------|-----------|
| TraumaHeal | Trauma recovery | EMDR, CPT, PE |
| MindSpace | Mental wellness | CBT, Mindfulness |
| RelationshipAI | Communication | Active listening, Validation |
| AnxietyCalm | Anxiety management | CBT, Mindfulness |
| MoodLift | Depression support | Behavioral activation, CBT |
| AddictionFree | Recovery support | Relapse prevention |
| GriefCompanion | Grief processing | Validation, Normalization |
| ChildMind | Youth mental health | Age-appropriate techniques |
| SleepWell | Sleep improvement | CBT-I, Relaxation |
| StressRelief | Stress management | Relaxation, Mindfulness |

---

## 2. Push Notifications Integration

### Setup

Push notifications are configured via Expo Notifications:
```
server/push-notifications-service.ts
```

### Features

- **Permission Handling**: Automatic permission requests
- **Device Token Management**: Tracks device tokens for each user
- **Scheduled Notifications**: Send notifications at specific times
- **Crisis Alerts**: Immediate crisis notifications
- **Appointment Reminders**: Notify users 1 hour before therapy sessions
- **Daily Check-Ins**: Customized check-in messages per app
- **Milestone Celebrations**: Notify users of recovery milestones

### Usage

```typescript
import pushNotifications from '@/server/push-notifications-service';

// Request permissions
const granted = await pushNotifications.requestPermissions();

// Send a notification
await pushNotifications.sendNotification({
  userId,
  appType: 'traumaheal',
  type: 'reminder',
  title: 'Time for your daily check-in',
  body: 'How are you feeling today?',
});

// Send appointment reminder (1 hour before)
await pushNotifications.sendAppointmentReminder(
  userId,
  'traumaheal',
  'Dr. Smith',
  appointmentTime
);

// Send daily check-in
await pushNotifications.sendDailyCheckIn(userId, 'mindspace');

// Send milestone notification
await pushNotifications.sendMilestoneNotification(
  userId,
  'addictionfree',
  '30 days sober'
);

// Send crisis alert
await pushNotifications.sendCrisisAlert(userId, 'traumaheal');

// Create recurring notification schedule
await pushNotifications.createNotificationSchedule(
  userId,
  'mindspace',
  'check_in',
  'daily',
  '08:00' // 8 AM
);
```

### Notification Types

| Type | Purpose | Timing |
|------|---------|--------|
| reminder | Daily check-ins and prompts | Scheduled |
| alert | Important updates | Immediate |
| crisis | Crisis support available | Immediate |
| milestone | Achievement celebrations | When earned |
| appointment | Therapy session reminders | 1 hour before |
| check_in | Daily mood/status check | Scheduled |

### Check-In Messages by App

Each app has customized daily check-in messages:

- **TraumaHeal**: "How are you feeling today? Take a moment to check in with yourself."
- **MindSpace**: "Time for your daily mood check-in. How are you feeling?"
- **RelationshipAI**: "How is your relationship today? Consider reaching out to your partner."
- **AnxietyCalm**: "Remember your breathing techniques. Take a moment to breathe deeply."
- **MoodLift**: "What activity can you do today to lift your mood?"
- **AddictionFree**: "You are doing great! Celebrate another day of recovery."
- **GriefCompanion**: "Take time to remember and honor your loved one today."
- **ChildMind**: "Check in with your child about their day and feelings."
- **SleepWell**: "Prepare for a good night sleep. Start your bedtime routine."
- **StressRelief**: "Take a moment to relax and manage your stress."

---

## 3. Cross-App Data Sync & Unified Profiles

### Setup

Cross-app data sync is available at:
```
server/cross-app-sync-service.ts
```

### Features

- **Unified User Profile**: Single profile across all 10 apps
- **App Preferences**: Enable/disable apps and control data sharing
- **Recovery Metrics**: Overall recovery score combining all apps
- **Data Sharing**: Share data between apps with user consent
- **Recovery Dashboard**: Unified view of all recovery progress
- **Data Export**: Export all user data in standard format
- **Data Deletion**: Complete user data deletion (GDPR compliant)

### Usage

```typescript
import crossAppSync from '@/server/cross-app-sync-service';

// Create unified profile
const profile = await crossAppSync.createUnifiedProfile(
  userId,
  'user@example.com',
  'John Doe'
);

// Get unified profile
const profile = await crossAppSync.getUnifiedProfile(userId);

// Sync data from one app to others
await crossAppSync.syncData(
  userId,
  'traumaheal', // source app
  'mood',
  { moodScore: 7, timestamp: new Date() },
  ['mindspace', 'stressrelief'] // share with these apps
);

// Get data shared with specific app
const sharedData = await crossAppSync.getSharedData(userId, 'mindspace');

// Calculate overall recovery score
const score = await crossAppSync.calculateOverallRecoveryScore(userId);

// Enable data sharing for an app
await crossAppSync.enableAppSharing(userId, 'anxietycalm');

// Disable data sharing for an app
await crossAppSync.disableAppSharing(userId, 'relationshipai');

// Get recovery dashboard
const dashboard = await crossAppSync.getRecoveryDashboard(userId);
console.log(`Overall score: ${dashboard.overallScore}/100`);
console.log(`Total sessions: ${dashboard.totalSessions}`);
console.log(`Current streak: ${dashboard.streak} days`);

// Export all user data
const exported = await crossAppSync.exportUserData(userId);

// Delete all user data
await crossAppSync.deleteUserData(userId);
```

### Unified Profile Structure

```typescript
{
  id: number;
  userId: number;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // App preferences
  appPreferences: {
    traumaheal: {
      enabled: boolean;
      notificationsEnabled: boolean;
      dataSharing: boolean;
      theme: 'light' | 'dark' | 'auto';
      language: string;
    },
    // ... other apps
  };
  
  // Recovery metrics
  recoveryMetrics: {
    overallScore: number; // 0-100
    appScores: Record<string, number>;
    totalSessions: number;
    totalMinutes: number;
    streak: number; // days
    lastActiveDate: Date;
    milestones: string[];
  };
  
  // Connected apps
  connectedApps: string[];
}
```

### Recovery Score Weighting

The overall recovery score is calculated using weighted contributions from each app:

| App | Weight | Contribution |
|-----|--------|--------------|
| TraumaHeal | 15% | Trauma recovery progress |
| MindSpace | 15% | Mental health trends |
| RelationshipAI | 10% | Relationship quality |
| AnxietyCalm | 10% | Anxiety management |
| MoodLift | 10% | Mood improvement |
| AddictionFree | 10% | Sobriety/recovery |
| GriefCompanion | 10% | Grief processing |
| ChildMind | 5% | Youth mental health |
| SleepWell | 10% | Sleep quality |
| StressRelief | 5% | Stress management |

### Data Sharing Consent

Users can control which apps share their data:
- Enable/disable each app independently
- Choose which data types to share
- View all shared data
- Revoke sharing at any time

---

## Integration Testing

### Test OpenRouter API

```bash
pnpm test server/openrouter.test.ts
```

This validates:
- API key is configured
- Can list available models
- Can make chat completion requests

### Test Push Notifications

```typescript
// Request permissions
const granted = await pushNotifications.requestPermissions();

// Get device token
const token = await pushNotifications.getDeviceToken();

// Send test notification
await pushNotifications.sendNotification({
  userId: testUserId,
  appType: 'mindspace',
  type: 'check_in',
  title: 'Test Notification',
  body: 'This is a test',
});
```

### Test Cross-App Sync

```typescript
// Create profile
const profile = await crossAppSync.createUnifiedProfile(
  testUserId,
  'test@example.com',
  'Test User'
);

// Sync data
await crossAppSync.syncData(
  testUserId,
  'traumaheal',
  'mood',
  { moodScore: 8 },
  ['mindspace']
);

// Get dashboard
const dashboard = await crossAppSync.getRecoveryDashboard(testUserId);
console.log(dashboard);
```

---

## Database Schema

The following tables support these integrations:

### therapy_sessions
- id, userId, appType, startTime, endTime, crisisDetected, notes

### therapy_messages
- id, sessionId, userId, role, content, timestamp, crisisLevel

### push_notifications
- id, userId, appType, type, title, body, sent, scheduledTime

### notification_schedules
- id, userId, appType, type, frequency, time, enabled

### unified_profiles
- id, userId, email, name, avatar, bio, appPreferences, recoveryMetrics

### cross_app_data
- id, userId, sourceApp, dataType, data, timestamp, shared, sharedWith

---

## Best Practices

### AI Therapist
1. Always check for crisis indicators
2. Provide crisis resources immediately
3. Keep conversation history for context
4. Generate session summaries for therapist review
5. Never replace professional mental health care

### Push Notifications
1. Request permissions on app startup
2. Respect user notification preferences
3. Use appropriate notification types
4. Schedule notifications at optimal times
5. Provide clear, actionable messages

### Cross-App Sync
1. Get explicit user consent before sharing data
2. Respect user privacy preferences
3. Encrypt sensitive data in transit
4. Allow data export and deletion
5. Maintain audit logs for HIPAA compliance

---

## Troubleshooting

### OpenRouter API Issues
- Verify API key is set: `echo $OPENROUTER_API_KEY`
- Check API rate limits
- Ensure request format matches OpenRouter spec
- Review error messages for specific issues

### Push Notification Issues
- Request permissions before sending
- Verify device token is available
- Check notification payload format
- Test on actual device (not simulator)
- Review Expo Notifications documentation

### Cross-App Sync Issues
- Verify unified profile exists
- Check app preferences are enabled
- Ensure data sharing consent is granted
- Validate data format before syncing
- Review database constraints

---

## Security Considerations

1. **API Keys**: Store securely in environment variables
2. **Data Encryption**: Encrypt sensitive data in database
3. **HIPAA Compliance**: Maintain audit logs and access controls
4. **User Consent**: Get explicit consent for data sharing
5. **Data Deletion**: Implement complete data deletion on request
6. **SSL/TLS**: Use HTTPS for all API calls
7. **Rate Limiting**: Protect endpoints from abuse

---

## Support & Resources

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [HIPAA Compliance](https://www.hhs.gov/hipaa)
- [Crisis Resources](https://suicidepreventionlifeline.org)

---

**Last Updated**: February 2026
**Version**: 1.0.0
**Status**: Production Ready
