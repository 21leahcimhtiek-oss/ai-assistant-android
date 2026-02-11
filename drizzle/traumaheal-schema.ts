// TraumaHeal Database Schema
// Complete schema for trauma therapy app with user data, sessions, and metrics

import {
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  mysqlEnum,
} from 'drizzle-orm/mysql-core';

// Users table (extended from base schema)
export const traumaUsers = mysqlTable('trauma_users', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull().unique(), // Reference to base users table
  traumaType: varchar('traumaType', { length: 100 }),
  recoveryGoals: text('recoveryGoals'),
  emergencyContact: varchar('emergencyContact', { length: 255 }),
  therapistId: int('therapistId'),
  preferredTherapyType: varchar('preferredTherapyType', { length: 100 }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

// AI Therapy Sessions
export const aiTherapySessions = mysqlTable('ai_therapy_sessions', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull(),
  sessionType: mysqlEnum('sessionType', [
    'general',
    'emdr-prep',
    'grounding',
    'processing',
    'integration',
  ])
    .default('general')
    .notNull(),
  startTime: timestamp('startTime').defaultNow().notNull(),
  endTime: timestamp('endTime'),
  crisisDetected: boolean('crisisDetected').default(false).notNull(),
  traumaIntensity: int('traumaIntensity').default(5).notNull(), // 0-10
  messageCount: int('messageCount').default(0).notNull(),
  sessionNotes: text('sessionNotes'),
  recommendations: text('recommendations'), // JSON array
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

// AI Therapy Messages
export const aiTherapyMessages = mysqlTable('ai_therapy_messages', {
  id: int('id').autoincrement().primaryKey(),
  sessionId: int('sessionId').notNull(),
  userId: int('userId').notNull(),
  role: mysqlEnum('role', ['user', 'therapist']).notNull(),
  content: text('content').notNull(),
  emotionalTone: mysqlEnum('emotionalTone', [
    'crisis',
    'distressed',
    'anxious',
    'neutral',
    'positive',
  ]),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Video Teletherapy Sessions
export const videoSessions = mysqlTable('video_sessions', {
  id: int('id').autoincrement().primaryKey(),
  therapistId: int('therapistId').notNull(),
  clientId: int('clientId').notNull(),
  scheduledTime: timestamp('scheduledTime').notNull(),
  duration: int('duration').notNull(), // minutes
  status: mysqlEnum('status', [
    'scheduled',
    'in-progress',
    'completed',
    'cancelled',
  ])
    .default('scheduled')
    .notNull(),
  videoUrl: varchar('videoUrl', { length: 500 }),
  recordingUrl: varchar('recordingUrl', { length: 500 }),
  notes: text('notes'),
  clientNotes: text('clientNotes'),
  rating: int('rating'), // 1-5
  feedback: text('feedback'),
  cost: decimal('cost', { precision: 10, scale: 2 }).notNull(),
  paymentStatus: mysqlEnum('paymentStatus', [
    'pending',
    'completed',
    'refunded',
  ])
    .default('pending')
    .notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

// Therapist Profiles
export const therapistProfiles = mysqlTable('therapist_profiles', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  specialization: text('specialization').notNull(), // JSON array
  credentials: varchar('credentials', { length: 255 }).notNull(),
  licenseNumber: varchar('licenseNumber', { length: 100 }).notNull().unique(),
  yearsExperience: int('yearsExperience').notNull(),
  rating: decimal('rating', { precision: 3, scale: 1 }).default('0'),
  reviewCount: int('reviewCount').default(0).notNull(),
  hourlyRate: decimal('hourlyRate', { precision: 10, scale: 2 }).notNull(),
  bio: text('bio'),
  profileImage: varchar('profileImage', { length: 500 }),
  verified: boolean('verified').default(false).notNull(),
  acceptingPatients: boolean('acceptingPatients').default(true).notNull(),
  availability: text('availability'), // JSON array of time slots
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

// Recovery Metrics (daily tracking)
export const recoveryMetrics = mysqlTable('recovery_metrics', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull(),
  date: timestamp('date').notNull(),
  traumaIntensity: int('traumaIntensity').notNull(), // 0-10
  anxietyLevel: int('anxietyLevel').notNull(), // 0-10
  moodScore: int('moodScore').notNull(), // 0-10
  sleepQuality: int('sleepQuality').notNull(), // 0-10
  sessionCount: int('sessionCount').default(0).notNull(),
  groundingExercises: int('groundingExercises').default(0).notNull(),
  emdrSessions: int('emdrSessions').default(0).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

// Milestones
export const milestones = mysqlTable('milestones', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  achievedDate: timestamp('achievedDate').notNull(),
  category: mysqlEnum('category', [
    'trauma',
    'anxiety',
    'mood',
    'sleep',
    'engagement',
  ]).notNull(),
  icon: varchar('icon', { length: 50 }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

// EMDR Sessions
export const emdrSessions = mysqlTable('emdr_sessions', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull(),
  startTime: timestamp('startTime').defaultNow().notNull(),
  endTime: timestamp('endTime'),
  pattern: mysqlEnum('pattern', [
    'horizontal',
    'diagonal',
    'circular',
    'figure-eight',
  ])
    .default('horizontal')
    .notNull(),
  speed: int('speed').default(1).notNull(), // 1-5
  duration: int('duration').notNull(), // seconds
  beforeIntensity: int('beforeIntensity').notNull(), // 0-10
  afterIntensity: int('afterIntensity').notNull(), // 0-10
  notes: text('notes'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

// Grounding Exercises
export const groundingExercises = mysqlTable('grounding_exercises', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull(),
  exerciseType: mysqlEnum('exerciseType', [
    '5-4-3-2-1',
    'box-breathing',
    'body-scan',
    'grounding-tap',
    'progressive-muscle',
  ]).notNull(),
  startTime: timestamp('startTime').defaultNow().notNull(),
  endTime: timestamp('endTime'),
  duration: int('duration').notNull(), // seconds
  intensityBefore: int('intensityBefore').notNull(), // 0-10
  intensityAfter: int('intensityAfter').notNull(), // 0-10
  notes: text('notes'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

// Trauma Timeline Events
export const traumaTimelineEvents = mysqlTable('trauma_timeline_events', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull(),
  eventTitle: varchar('eventTitle', { length: 255 }).notNull(),
  eventDate: timestamp('eventDate'),
  description: text('description'),
  intensity: int('intensity').notNull(), // 0-10
  processed: boolean('processed').default(false).notNull(),
  processingNotes: text('processingNotes'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

// Safety Plans
export const safetyPlans = mysqlTable('safety_plans', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull().unique(),
  warningSignsOfCrisis: text('warningSignsOfCrisis'),
  copingStrategies: text('copingStrategies'), // JSON array
  peopleToContact: text('peopleToContact'), // JSON array
  professionalContacts: text('professionalContacts'), // JSON array
  crisisResources: text('crisisResources'), // JSON array
  safeEnvironmentDescription: text('safeEnvironmentDescription'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

// Holographic Session Records
export const holographicSessions = mysqlTable('holographic_sessions', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull(),
  sessionType: mysqlEnum('sessionType', [
    'trauma-timeline',
    'emdr-butterfly',
    'grounding-sphere',
    'healing-light',
    'safe-space',
  ]).notNull(),
  startTime: timestamp('startTime').defaultNow().notNull(),
  endTime: timestamp('endTime'),
  duration: int('duration').notNull(), // seconds
  gestures: text('gestures'), // JSON array of gesture events
  hapticFeedback: boolean('hapticFeedback').default(true).notNull(),
  intensityBefore: int('intensityBefore').notNull(), // 0-10
  intensityAfter: int('intensityAfter').notNull(), // 0-10
  notes: text('notes'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

// Cross-App Linking
export const appLinkings = mysqlTable('app_linkings', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull(),
  linkedAppSlug: varchar('linkedAppSlug', { length: 100 }).notNull(),
  linkedAppName: varchar('linkedAppName', { length: 255 }).notNull(),
  linkedAt: timestamp('linkedAt').defaultNow().notNull(),
  sharedDataTypes: text('sharedDataTypes'), // JSON array
  syncEnabled: boolean('syncEnabled').default(false).notNull(),
});

// Export types
export type TraumaUser = typeof traumaUsers.$inferSelect;
export type InsertTraumaUser = typeof traumaUsers.$inferInsert;

export type AITherapySession = typeof aiTherapySessions.$inferSelect;
export type InsertAITherapySession = typeof aiTherapySessions.$inferInsert;

export type AITherapyMessage = typeof aiTherapyMessages.$inferSelect;
export type InsertAITherapyMessage = typeof aiTherapyMessages.$inferInsert;

export type VideoSession = typeof videoSessions.$inferSelect;
export type InsertVideoSession = typeof videoSessions.$inferInsert;

export type TherapistProfile = typeof therapistProfiles.$inferSelect;
export type InsertTherapistProfile = typeof therapistProfiles.$inferInsert;

export type RecoveryMetric = typeof recoveryMetrics.$inferSelect;
export type InsertRecoveryMetric = typeof recoveryMetrics.$inferInsert;

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = typeof milestones.$inferInsert;

export type EMDRSession = typeof emdrSessions.$inferSelect;
export type InsertEMDRSession = typeof emdrSessions.$inferInsert;

export type GroundingExercise = typeof groundingExercises.$inferSelect;
export type InsertGroundingExercise = typeof groundingExercises.$inferInsert;

export type TraumaTimelineEvent = typeof traumaTimelineEvents.$inferSelect;
export type InsertTraumaTimelineEvent = typeof traumaTimelineEvents.$inferInsert;

export type SafetyPlan = typeof safetyPlans.$inferSelect;
export type InsertSafetyPlan = typeof safetyPlans.$inferInsert;

export type HolographicSession = typeof holographicSessions.$inferSelect;
export type InsertHolographicSession = typeof holographicSessions.$inferInsert;

export type AppLinking = typeof appLinkings.$inferSelect;
export type InsertAppLinking = typeof appLinkings.$inferInsert;
