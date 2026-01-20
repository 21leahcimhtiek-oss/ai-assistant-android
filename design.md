# AI Assistant Pro - Mobile App Design

## Overview
A powerful AI coding assistant for Android with unrestricted capabilities, user-controlled phone access, web scraping with rotating proxies, and deep web connectivity.

## Design Philosophy
- **Mobile-first**: Optimized for portrait orientation (9:16) and one-handed usage
- **iOS HIG compliant**: Feels like a native iOS app with mainstream design standards
- **Privacy-focused**: User explicitly controls all permissions
- **Dark theme default**: Suitable for coding and technical work

## Screen List

### 1. Chat Screen (Home)
**Primary Content:**
- Full-screen chat interface with AI assistant
- Message bubbles (user messages on right, AI on left)
- Code blocks with syntax highlighting
- Inline action buttons (copy code, execute, etc.)
- Input field with multi-line support at bottom
- Model selector in header

**Functionality:**
- Send text messages to AI
- Receive AI responses with code, explanations
- Copy code snippets
- Execute code locally (with permission)
- Attach files/images to messages
- Voice input support

### 2. Permissions Screen
**Primary Content:**
- List of available phone permissions with toggle switches
- Each permission shows:
  - Icon representing the feature
  - Permission name (e.g., "File System Access")
  - Description of what AI can do with it
  - Status (Granted/Denied)
- Warning banner at top explaining security implications

**Functionality:**
- Toggle individual permissions on/off
- Request system permissions when needed
- Revoke granted permissions
- View permission usage history

### 3. Web Tools Screen
**Primary Content:**
- Web scraping controls
- Proxy configuration section showing:
  - Current proxy status (active/rotating)
  - Number of proxies in rotation
  - Current IP address
- Deep web/Tor connectivity toggle
- Connection status indicators
- Scraping history list

**Functionality:**
- Enable/disable proxy rotation
- Configure proxy settings
- Enable Tor connectivity
- View scraping logs
- Test current connection anonymity

### 4. Settings Screen
**Primary Content:**
- AI Model settings (OpenRouter configuration)
- App preferences (theme, notifications)
- Security settings
- Storage management
- About section

**Functionality:**
- Select default AI model
- Configure API settings
- Clear chat history
- Export/import settings
- View app version and info

## Key User Flows

### Flow 1: First-time Setup
1. User opens app → Welcome screen with brief intro
2. User taps "Get Started" → Navigate to Chat screen
3. AI sends welcome message explaining capabilities
4. User asks AI to access a phone feature → Permission request dialog appears
5. User grants/denies → AI responds accordingly

### Flow 2: Coding Assistance
1. User types coding question in chat input
2. User taps send → Message appears in chat
3. AI processes and responds with code
4. User taps "Copy" button on code block → Code copied to clipboard
5. User can ask follow-up questions

### Flow 3: Web Scraping with Proxy
1. User navigates to Web Tools tab
2. User enables "Proxy Rotation" toggle
3. User returns to Chat tab
4. User asks AI to scrape a website
5. AI uses rotating proxies → Returns scraped data
6. User can view scraping logs in Web Tools tab

### Flow 4: Permission Management
1. User navigates to Permissions tab
2. User sees list of all available permissions
3. User toggles off "Camera Access"
4. User returns to Chat
5. User asks AI to take a photo → AI responds that camera permission is denied
6. User can grant permission from chat or return to Permissions tab

## Color Choices

**Brand Colors:**
- Primary: `#00D9FF` (Cyan Blue) - Tech-forward, AI-themed
- Background (Dark): `#0A0E14` (Deep Dark Blue)
- Surface (Dark): `#151B24` (Slightly lighter blue-gray)
- Foreground: `#E6E8EB` (Off-white for text)
- Muted: `#8B92A0` (Gray for secondary text)
- Border: `#1E2530` (Subtle borders)
- Success: `#00FF88` (Bright green for active states)
- Warning: `#FFB800` (Amber for warnings)
- Error: `#FF4757` (Red for errors/denied permissions)

**Accent Colors:**
- Code blocks: `#1A1F2B` background with `#00D9FF` highlights
- User messages: `#00D9FF` with `#0A0E14` text
- AI messages: `#151B24` with `#E6E8EB` text

## Typography
- Headers: Bold, 24-28px
- Body text: Regular, 16px, line-height 1.5
- Code: Monospace (Courier/Monaco), 14px
- Captions: Regular, 14px

## Layout Patterns
- **Chat bubbles**: Max 80% screen width, rounded corners (16px)
- **Input field**: Fixed at bottom with safe area padding
- **Tab bar**: 4 tabs (Chat, Permissions, Web Tools, Settings)
- **Cards**: Used for permission items and settings groups
- **Lists**: For scraping history and logs

## Interaction Patterns
- **Message send**: Scale animation (0.97) + light haptic
- **Permission toggle**: Medium haptic + immediate visual feedback
- **Code copy**: Success toast + light haptic
- **Tab switch**: Smooth transition, no animation needed
