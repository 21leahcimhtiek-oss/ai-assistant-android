# TraumaHeal Backend Setup Guide

## Overview

TraumaHeal includes a complete backend infrastructure with PostgreSQL/MySQL database, tRPC API routes, and server integration for trauma therapy features.

## Database Schema

The database includes the following tables:

### Core Tables

- **trauma_users** - Extended user profiles with trauma information
- **ai_therapy_sessions** - AI therapist conversation sessions
- **ai_therapy_messages** - Individual messages in therapy sessions
- **video_sessions** - Professional video therapy bookings
- **therapist_profiles** - Professional therapist information
- **recovery_metrics** - Daily recovery tracking metrics
- **milestones** - User achievement milestones
- **emdr_sessions** - EMDR therapy session records
- **grounding_exercises** - Grounding exercise tracking
- **trauma_timeline_events** - Trauma event timeline entries
- **safety_plans** - User safety plans
- **holographic_sessions** - AR/holographic session records
- **app_linkings** - Cross-app linking connections

## API Endpoints

### AI Therapy (`/api/traumaheal/aiTherapy`)

```typescript
// Start new session
POST /aiTherapy/startSession
Input: { sessionType: 'general' | 'emdr-prep' | 'grounding' | 'processing' | 'integration' }
Output: { sessionId, userId, sessionType, startTime }

// Send message to AI therapist
POST /aiTherapy/sendMessage
Input: { sessionId, message }
Output: { messageId, response, crisisDetected, recommendations }

// Get session messages
GET /aiTherapy/getMessages
Input: { sessionId }
Output: Array<Message>

// End session with summary
POST /aiTherapy/endSession
Input: { sessionId }
Output: { sessionId, summary, recommendations }
```

### Video Teletherapy (`/api/traumaheal/videoTherapy`)

```typescript
// Get available therapists
GET /videoTherapy/getTherapists
Input: { specialization?, maxRate? }
Output: Array<Therapist>

// Search therapists
GET /videoTherapy/searchTherapists
Input: { query }
Output: Array<Therapist>

// Book video session
POST /videoTherapy/bookSession
Input: { therapistId, scheduledTime, duration, reason }
Output: { sessionId, status, cost }

// Get upcoming sessions
GET /videoTherapy/getUpcomingSessions
Output: Array<VideoSession>

// Get past sessions
GET /videoTherapy/getPastSessions
Output: Array<VideoSession>

// Rate session
POST /videoTherapy/rateSession
Input: { sessionId, rating, feedback? }
Output: { success }
```

### Recovery Metrics (`/api/traumaheal/metrics`)

```typescript
// Record daily metric
POST /metrics/recordMetric
Input: {
  traumaIntensity: 0-10,
  anxietyLevel: 0-10,
  moodScore: 0-10,
  sleepQuality: 0-10,
  sessionCount?: number,
  groundingExercises?: number,
  emdrSessions?: number
}
Output: { success, metricId }

// Get recovery score
GET /metrics/getRecoveryScore
Output: {
  overall: 0-100,
  trauma: 0-100,
  anxiety: 0-100,
  mood: 0-100,
  sleep: 0-100,
  engagement: 0-100,
  trend: 'improving' | 'stable' | 'declining'
}

// Get metrics for date range
GET /metrics/getMetrics
Input: { startDate, endDate }
Output: Array<RecoveryMetric>

// Get analytics report
GET /metrics/getAnalyticsReport
Input: { period: 'week' | 'month' | 'year' }
Output: AnalyticsReport
```

### EMDR (`/api/traumaheal/emdr`)

```typescript
// Create EMDR session
POST /emdr/createSession
Input: { pattern, speed: 1-5, beforeIntensity: 0-10 }
Output: { sessionId, pattern, speed }

// End EMDR session
POST /emdr/endSession
Input: { sessionId, afterIntensity: 0-10, notes? }
Output: { sessionId, intensityReduction, success }

// Get EMDR history
GET /emdr/getHistory
Output: Array<EMDRSession>
```

### Grounding Exercises (`/api/traumaheal/grounding`)

```typescript
// Start grounding exercise
POST /grounding/startExercise
Input: {
  exerciseType: '5-4-3-2-1' | 'box-breathing' | 'body-scan' | 'grounding-tap' | 'progressive-muscle',
  intensityBefore: 0-10
}
Output: { exerciseId, exerciseType, startTime }

// End grounding exercise
POST /grounding/endExercise
Input: { exerciseId, intensityAfter: 0-10, notes? }
Output: { exerciseId, success, intensityReduction }

// Get exercise history
GET /grounding/getHistory
Output: Array<GroundingExercise>
```

### Trauma Timeline (`/api/traumaheal/timeline`)

```typescript
// Create timeline event
POST /timeline/createEvent
Input: { eventTitle, eventDate?, description?, intensity: 0-10 }
Output: { eventId, title, intensity }

// Get timeline events
GET /timeline/getEvents
Output: Array<TraumaTimelineEvent>

// Update event processing status
PUT /timeline/updateEvent
Input: { eventId, processed, processingNotes? }
Output: { success }
```

### Safety Plan (`/api/traumaheal/safety`)

```typescript
// Create safety plan
POST /safety/createPlan
Input: {
  warningSignsOfCrisis,
  copingStrategies: string[],
  peopleToContact: { name, phone }[],
  crisisResources: { name, phone }[]
}
Output: { planId, success }

// Get safety plan
GET /safety/getPlan
Output: SafetyPlan | null

// Update safety plan
PUT /safety/updatePlan
Input: { planId, data }
Output: { success }
```

### Milestones (`/api/traumaheal/milestones`)

```typescript
// Add milestone
POST /milestones/addMilestone
Input: { title, description?, category, icon? }
Output: { milestoneId, success }

// Get milestones
GET /milestones/getMilestones
Output: Array<Milestone>
```

### Cross-App Linking (`/api/traumaheal/linking`)

```typescript
// Link to another app
POST /linking/linkApp
Input: { linkedAppSlug, linkedAppName, sharedDataTypes: string[] }
Output: { linkingId, success }

// Get linked apps
GET /linking/getLinkedApps
Output: Array<AppLinking>

// Sync data with linked app
POST /linking/syncData
Input: { linkedAppSlug }
Output: { success, syncedRecords }
```

## Database Migration

To add the TraumaHeal schema to your database:

1. **Copy schema file** to `drizzle/schema.ts`:
   ```bash
   cat drizzle/traumaheal-schema.ts >> drizzle/schema.ts
   ```

2. **Run migration**:
   ```bash
   pnpm db:push
   ```

3. **Verify tables** were created in your database

## Environment Variables

Add these to your `.env` file:

```env
# Database (already configured)
DATABASE_URL=mysql://user:password@localhost:3306/traumaheal

# OpenRouter API (for AI therapist)
OPENROUTER_API_KEY=your_openrouter_key

# Stripe (for payment processing)
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Video Teletherapy (optional)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

## Frontend Integration

### Using tRPC Hooks

```typescript
import { trpc } from "@/lib/trpc";

function AITherapyScreen() {
  // Start session
  const startSession = trpc.traumaheal.aiTherapy.startSession.useMutation();
  
  // Send message
  const sendMessage = trpc.traumaheal.aiTherapy.sendMessage.useMutation();
  
  // Get recovery score
  const { data: score } = trpc.traumaheal.metrics.getRecoveryScore.useQuery();

  const handleStartSession = async () => {
    const session = await startSession.mutateAsync({
      sessionType: 'general'
    });
    console.log('Session started:', session);
  };

  return (
    <View>
      <Button title="Start Session" onPress={handleStartSession} />
    </View>
  );
}
```

## Authentication

All protected endpoints require user authentication via `useAuth()` hook:

```typescript
import { useAuth } from "@/hooks/use-auth";

function MyComponent() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // User is authenticated, can call protected endpoints
}
```

## Error Handling

Handle API errors properly:

```typescript
try {
  await trpc.traumaheal.aiTherapy.sendMessage.mutateAsync({
    sessionId: 'session_123',
    message: 'Help me process this trauma'
  });
} catch (error) {
  if (error.data?.code === 'UNAUTHORIZED') {
    // User not authenticated
    router.push('/login');
  } else if (error.data?.code === 'FORBIDDEN') {
    // User doesn't have permission
    showError('You don\'t have access to this resource');
  } else {
    // Other error
    showError(error.message);
  }
}
```

## Deployment

### Production Checklist

- [ ] Database credentials configured
- [ ] OpenRouter API key added
- [ ] Stripe keys configured (if using payments)
- [ ] Environment variables set in production
- [ ] Database migrations run
- [ ] CORS configured for frontend domain
- [ ] SSL/TLS enabled
- [ ] Rate limiting configured
- [ ] Error logging configured
- [ ] Backup strategy implemented

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

## Monitoring & Logging

Monitor these key metrics:

- AI therapy session success rate
- Video session completion rate
- API response times
- Database query performance
- Error rates by endpoint
- User engagement metrics

## Security Considerations

1. **Authentication**: All user data requires authentication
2. **Data Privacy**: Encrypt sensitive data (trauma details, therapy notes)
3. **HIPAA Compliance**: Ensure compliance with healthcare regulations
4. **Rate Limiting**: Implement rate limiting on API endpoints
5. **Input Validation**: Validate all user inputs with Zod schemas
6. **SQL Injection**: Use parameterized queries (Drizzle ORM handles this)
7. **CORS**: Configure CORS properly for frontend domain

## Support

For issues or questions:
1. Check the error logs
2. Review API documentation
3. Test endpoints with Postman/curl
4. Check database connectivity
5. Verify environment variables

---

**Last Updated**: February 2026
**Version**: 1.0.0
