# MindSpace - TODO

## Branding
- [x] Generate MindSpace logo
- [x] Update app.config.ts with MindSpace branding
- [x] Update theme colors to calming palette

## AI Therapist
- [x] Configure OpenRouter with CBT-focused system prompts
- [x] Create therapeutic conversation templates
- [x] Implement session history storage
- [x] Add crisis detection in conversations
- [x] Create suggested conversation starters

## Mood Tracking
- [x] Mood selector component (1-10 scale)
- [x] Emotion wheel for detailed feelings
- [x] Mood history storage with AsyncStorage
- [x] Mood calendar view
- [x] Mood trend graphs
- [x] Mood triggers and notes

## Journaling
- [x] Journal entry list screen
- [x] Create/edit journal entry
- [x] Daily prompts library
- [x] Guided journaling questions
- [x] Search and filter entries
- [x] Mood tagging on entries
- [x] Writing streak tracker

## CBT Exercises & Tools
- [x] Exercises library screen
- [x] Breathing exercise with animation
- [x] 5-4-3-2-1 grounding technique
- [x] Thought challenging worksheet
- [x] Progressive muscle relaxation
- [x] Gratitude practice
- [x] Exercise completion tracking

## Progress & Insights
- [x] Progress dashboard
- [x] Mood trend charts
- [x] Therapy session insights
- [x] Exercise completion stats
- [x] Goals and milestones
- [x] Wellness score calculation

## Crisis Support
- [x] Crisis resources screen
- [x] Emergency hotline numbers
- [x] Crisis button (always visible)
- [x] Safety plan feature
- [x] Quick grounding exercises
- [x] Supportive messages

## UI Screens
- [ ] Home/Dashboard screen
- [ ] Therapy chat screen
- [ ] Mood tracking screen
- [ ] Journal screen
- [ ] Exercises library screen
- [ ] Progress screen
- [ ] Crisis resources screen
- [ ] Settings screen
- [ ] Tab bar navigation (5 tabs)

## Settings & Data
- [ ] User preferences
- [ ] Notification reminders
- [ ] Data export functionality
- [ ] Privacy controls
- [ ] Theme customization
- [ ] Backup and restore

## Polish & Testing
- [ ] Test all therapeutic flows
- [ ] Verify crisis support accessibility
- [ ] Test mood tracking accuracy
- [ ] Validate data privacy
- [ ] Add haptic feedback
- [ ] Optimize performance

## Professional Therapist Integration
- [x] Therapist directory/marketplace
- [x] Therapist profiles (credentials, specialties, availability) - 10 diverse therapists added
- [x] Session booking system
- [x] Video call integration for teletherapy
- [ ] Share progress reports with therapist
- [x] Therapist marketplace UI screen
- [x] Progress tracking UI screen
- [ ] Therapist dashboard to monitor patient progress
- [x] HIPAA compliance and data encryption
- [ ] Insurance verification system
- [ ] Payment processing for sessions
- [ ] Therapist verification and credentialing
- [ ] Patient-therapist messaging
- [ ] Session notes and treatment plans


## Remaining UI Screens
- [x] Therapy chat screen
- [x] Mood tracker screen
- [x] Journal screen
- [x] Exercises screen
- [x] Crisis support screen
- [x] Settings screen (update existing)
- [x] Home dashboard screen (update existing)

- [x] Data visualization with mood trend charts

## Real-time Features
- [ ] Push notifications setup
- [ ] Therapy session reminders
- [ ] Mood check-in prompts
- [ ] Crisis support alerts
- [ ] Daily wellness notifications


## Push Notifications (New)
- [x] Push notification service implementation
- [x] Notification permission requests
- [x] User notification preferences in settings
- [x] Daily mood check-in reminders
- [x] Therapy session reminders
- [x] Motivational message notifications
- [x] Crisis alert notifications

## Real Therapist API Integration (New)
- [x] Research and select therapist API (Psychology Today)
- [x] API authentication and setup
- [x] Live therapist availability integration
- [x] Real-time booking system
- [x] Session management with real therapists
- [ ] Payment integration for sessions (requires Stripe/payment processor setup)


## Data Export Feature (New)
- [x] PDF export service implementation
- [x] Export mood history as PDF
- [x] Export journal entries as PDF
- [x] Export progress report as PDF
- [x] Export buttons in Settings screen
- [x] Share exported files functionality


## Stripe Payment Integration (New)
- [x] Install Stripe SDK
- [x] Create subscription service
- [x] Implement Free/Premium/Pro tier management
- [x] Add subscription status checking
- [x] Create paywall screens
- [ ] Add payment UI in settings
- [x] Handle subscription lifecycle (upgrade/downgrade/cancel)

## Onboarding Flow (New)
- [x] Create onboarding screens (4 screens)
- [x] Add skip/next navigation
- [x] Implement first-time user detection
- [x] Add welcome screen
- [x] Add feature highlights screens
- [x] Store onboarding completion status

## Biometric Authentication (New)
- [x] Install expo-local-authentication
- [x] Implement biometric lock toggle
- [x] Add Face ID/Fingerprint prompt on app open
- [x] Store biometric preference
- [x] Add fallback PIN option (handled by OS)
- [x] Add biometric settings in Settings screen


## In-App Review Prompts (New)
- [x] Install expo-store-review
- [x] Create review prompt service
- [x] Track usage milestones (7 days, 5 journal entries, 10 mood entries, 1 therapy session)
- [x] Show review prompt at appropriate times
- [x] Respect user's "Don't ask again" preference

## Dark Mode Improvements (New)
- [x] Enhance contrast for text on dark backgrounds (foreground: #F0F2F5, muted: #B0B8C4)
- [x] Improve OLED-friendly pure black backgrounds (#000000)
- [x] Adjust chart colors for dark mode visibility (brighter mood colors)
- [x] Test all screens in dark mode

## Smart Wellness Reminders (New)
- [x] Track mood patterns (3 consecutive days below 5/10)
- [x] Trigger exercise suggestions when mood drops
- [x] Create smart notification service
- [x] Add user preference to enable/disable smart reminders


## Community Support Groups (New)
- [x] Create support group service
- [x] Anonymous user profiles for groups
- [x] Group categories (anxiety, depression, PTSD, addiction, grief, relationships)
- [x] Post creation and commenting
- [x] AI moderation for safety
- [x] Report/flag inappropriate content
- [x] Community guidelines
- [x] Support group UI screen

## Voice Journaling (New)
- [x] Install expo-av for audio recording
- [x] Audio recording component
- [x] Transcription service integration
- [x] Save audio files with transcriptions
- [x] Play/pause audio playback
- [x] Add voice recording to journal screen
- [x] Display audio entries in journal list

## Medication Tracker (New)
- [ ] Medication data model
- [ ] Add/edit/delete medications
- [ ] Dosage and schedule tracking
- [ ] Medication reminders/notifications
- [ ] Side effects logging
- [ ] Effectiveness ratings
- [ ] Medication history view
- [ ] Export medication report for therapist
- [ ] Medication tracker UI screen
