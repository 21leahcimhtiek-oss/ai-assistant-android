# MindSpace - Mobile App Design

## Overview
MindSpace is an AI-assisted mental health and CBT (Cognitive Behavioral Therapy) mobile app that provides accessible, evidence-based therapeutic support. The app combines AI-powered therapy sessions with mood tracking, journaling, CBT exercises, and crisis resources.

## Design Philosophy
- **Mobile-first**: Optimized for portrait orientation (9:16) and one-handed usage
- **iOS HIG compliant**: Feels like a native iOS app with mainstream design standards
- **Calming & supportive**: Warm, gentle design that reduces anxiety
- **Privacy-focused**: All data stored locally on device
- **Accessible**: Clear typography, high contrast, simple navigation

## Screen List

### 1. Home/Dashboard Screen
**Primary Content:**
- Daily mood check-in prompt at top
- Quick access cards for key features
- Recent journal entries preview
- Mood trend graph (last 7 days)
- Motivational quote or affirmation
- Quick crisis button (always visible)

**Functionality:**
- Tap mood check-in to log current mood
- Access therapy chat, journal, exercises
- View mood history and insights
- Emergency crisis support access

### 2. Therapy Chat Screen
**Primary Content:**
- Full-screen chat interface with AI therapist
- Message bubbles with warm, supportive design
- Therapy session history
- Suggested conversation starters
- Session notes and insights

**Functionality:**
- Chat with AI therapist trained in CBT
- Receive personalized coping strategies
- Save important insights
- Schedule follow-up sessions
- Export session transcripts

### 3. Mood Tracking Screen
**Primary Content:**
- Current mood selector (visual scale 1-10)
- Emotion wheel for detailed feelings
- Mood history calendar view
- Trend graphs and patterns
- Mood triggers and notes

**Functionality:**
- Log mood multiple times per day
- Add context notes to mood entries
- Identify patterns and triggers
- View mood correlations
- Export mood data

### 4. Journal Screen
**Primary Content:**
- List of journal entries (newest first)
- Daily prompts and guided questions
- Search and filter entries
- Mood tags on each entry
- Writing streak counter

**Functionality:**
- Create new journal entries
- Use guided prompts or free-write
- Tag entries with emotions
- Search past entries
- Lock journal with biometrics

### 5. Exercises & Tools Screen
**Primary Content:**
- Library of CBT exercises organized by category
- Breathing exercises with animations
- Thought challenging worksheets
- Grounding techniques (5-4-3-2-1)
- Progressive muscle relaxation
- Gratitude practices

**Functionality:**
- Browse exercises by need (anxiety, depression, stress)
- Follow guided exercises
- Track completed exercises
- Favorite frequently used tools
- Set reminders for practice

### 6. Progress Screen
**Primary Content:**
- Overall wellness score
- Mood trends over time
- Therapy session insights
- Exercise completion stats
- Journal writing streak
- Goals and milestones

**Functionality:**
- View progress charts
- Set personal goals
- Celebrate achievements
- Export progress reports
- Share with therapist (optional)

### 7. Crisis Resources Screen
**Primary Content:**
- Emergency hotline numbers
- Crisis text lines
- Local emergency services
- Breathing exercise (quick access)
- Safety plan checklist
- Supportive messages

**Functionality:**
- One-tap call to crisis lines
- Access safety plan
- Quick grounding exercises
- Emergency contacts
- Location-based resources

### 8. Settings Screen
**Primary Content:**
- Profile and preferences
- Notification settings
- Data privacy controls
- Theme customization
- Backup and export
- Professional resources

**Functionality:**
- Customize app experience
- Manage reminders
- Export all data
- Find professional therapists
- Privacy settings

## Key User Flows

### Flow 1: Daily Check-in
1. User opens app → Home screen with mood prompt
2. User taps "How are you feeling?" → Mood selector appears
3. User selects mood (1-10 scale) → Emotion wheel appears
4. User selects specific emotions → Option to add notes
5. User adds context → Mood logged, returns to home

### Flow 2: Therapy Session
1. User taps "Talk to Therapist" → Chat screen opens
2. AI greets user warmly → Asks how they're doing
3. User shares concerns → AI responds with CBT techniques
4. AI suggests exercises → User can try them immediately
5. Session ends → Key insights saved automatically

### Flow 3: Using CBT Exercise
1. User feels anxious → Opens Exercises tab
2. User selects "Anxiety" category → List of exercises appears
3. User taps "5-4-3-2-1 Grounding" → Guided exercise starts
4. User follows prompts → Exercise completes
5. User rates helpfulness → Exercise logged in progress

### Flow 4: Crisis Support
1. User in crisis → Taps crisis button (always visible)
2. Crisis screen opens immediately → Shows hotline numbers
3. User can call with one tap → Or use quick grounding exercise
4. Access to safety plan → Supportive messages displayed
5. Option to chat with AI for immediate support

## Color Choices

**Brand Colors:**
- Primary: `#6B9BD1` (Calming Blue) - Trust, peace, stability
- Secondary: `#A8D5BA` (Soft Green) - Growth, healing, hope
- Background (Light): `#F8F9FA` (Off-white)
- Background (Dark): `#1A1D23` (Soft dark)
- Surface: `#FFFFFF` (Pure white cards)
- Foreground: `#2C3E50` (Dark blue-gray for text)
- Muted: `#7F8C8D` (Gray for secondary text)
- Border: `#E8EAED` (Subtle borders)
- Success: `#52C41A` (Positive green)
- Warning: `#FAAD14` (Gentle amber)
- Error: `#F5222D` (Alert red)
- Crisis: `#FF6B6B` (Urgent but not alarming)

**Mood Colors:**
- Great: `#52C41A` (Bright green)
- Good: `#A8D5BA` (Soft green)
- Okay: `#FFD93D` (Warm yellow)
- Low: `#FFA07A` (Soft orange)
- Bad: `#FF6B6B` (Gentle red)

## Typography
- Headers: Semi-bold, 24-28px
- Body text: Regular, 16px, line-height 1.6
- Captions: Regular, 14px
- Buttons: Semi-bold, 16px
- Quotes: Italic, 18px

## Layout Patterns
- **Cards**: Rounded corners (16px), subtle shadows
- **Mood selector**: Large, tappable emoji/icons
- **Chat bubbles**: Asymmetric (AI left, user right), max 85% width
- **Exercise cards**: Image + title + duration
- **Graphs**: Simple line charts, no clutter
- **Crisis button**: Fixed position, always accessible

## Interaction Patterns
- **Mood logging**: Gentle haptic feedback
- **Exercise completion**: Celebration animation + haptic
- **Journal save**: Auto-save with visual confirmation
- **Crisis button**: Immediate response, no delays
- **Therapy responses**: Typing indicator for realism

## Therapeutic Approach
- **CBT-focused**: Thought challenging, behavioral activation
- **Trauma-informed**: Gentle, non-judgmental language
- **Evidence-based**: Proven therapeutic techniques
- **Personalized**: Adapts to user's needs and progress
- **Supportive**: Warm, empathetic AI responses
