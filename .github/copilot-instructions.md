# GitHub Copilot Instructions for AI Assistant Android (MindSpace)

## For Copilot Coding Agent

When you are assigned an issue in this repository:
1. **Read this entire document first** to understand project context, conventions, and workflows
2. **Check the linked resources** - design.md, APP_STORE_LISTINGS.md, and other documentation
3. **Run the setup steps** defined in `.github/workflows/copilot-setup-steps.yml` to prepare your environment
4. **Follow the development workflow** described below for making changes
5. **Test thoroughly** before opening a PR - run linting, type checking, and tests
6. **Request human review** - never merge your own PRs, and provide clear descriptions of your changes

## Project Overview

**MindSpace** is an AI-assisted mental health and CBT (Cognitive Behavioral Therapy) mobile app that provides accessible, evidence-based therapeutic support. The app combines AI-powered therapy sessions with mood tracking, journaling, CBT exercises, and crisis resources.

### Core Features
- **AI Therapy Chat**: Chat with an AI therapist trained in CBT techniques
- **Mood Tracking**: Log moods, identify patterns, and view trends
- **Journaling**: Guided prompts and free-write journaling with mood tags
- **CBT Exercises**: Breathing exercises, thought challenging, grounding techniques
- **Progress Tracking**: Wellness scores, mood trends, and milestones
- **Crisis Support**: Quick access to emergency resources

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React Native 0.81, Expo SDK 54, NativeWind (Tailwind CSS) |
| Navigation | Expo Router 6 (file-based routing) |
| Backend | Express, tRPC 11 |
| Database | MySQL with Drizzle ORM |
| Auth | JWT (jose), Expo Secure Store |
| Payments | Stripe (React Native) |
| AI | OpenRouter API for AI therapist |
| Notifications | Expo Notifications |
| Video | Stream.io Video SDK |
| Build | EAS Build, esbuild, TypeScript 5.9 |

## Development Commands

```bash
# Install dependencies
pnpm install

# Development (runs both server and Metro bundler)
pnpm dev

# Development (specific)
pnpm dev:server    # Express + tRPC backend
pnpm dev:metro     # Expo Metro bundler (web on port 8081)

# Mobile development
pnpm android       # Start on Android
pnpm ios           # Start on iOS

# Build for production
pnpm build

# Start production server
pnpm start

# Type checking
pnpm check

# Linting
pnpm lint

# Code formatting
pnpm format

# Run tests
pnpm test

# Database operations
pnpm db:push       # Generate and run migrations

# Generate QR code for mobile testing
pnpm qr
```

## Project Structure

```
ai-assistant-android/
├── app/                          # Expo Router (file-based routing)
│   ├── (tabs)/                   # Tab navigation screens
│   │   ├── index.tsx             # Home/Dashboard
│   │   ├── therapy.tsx           # AI Therapy Chat
│   │   ├── mood.tsx              # Mood Tracking
│   │   ├── journal.tsx           # Journaling
│   │   └── settings.tsx          # Settings
│   ├── _layout.tsx               # Root layout
│   ├── index.tsx                 # Entry point
│   ├── onboarding.tsx            # Onboarding flow
│   ├── oauth/                    # OAuth callback screens
│   └── dev/                      # Development-only screens
├── components/                   # Reusable React Native components
│   └── ui/                       # UI primitives
├── server/                       # Express backend
│   ├── _core/                    # Framework internals
│   │   └── index.ts              # Server entry point
│   ├── routers.ts                # tRPC API procedures
│   ├── db.ts                     # Database queries
│   ├── openrouter-therapist-service.ts  # AI therapist service
│   ├── stripe-service.ts         # Stripe payment handling
│   ├── push-notifications-service.ts    # Push notifications
│   ├── email-marketing-service.ts       # Email service
│   ├── social-auth-service.ts           # Social auth
│   ├── wearable-service.ts              # Wearable integration
│   ├── analytics-integration-service.ts # Analytics
│   ├── traumaheal-router.ts             # Trauma healing module
│   └── *.test.ts                 # Vitest tests
├── lib/                          # Utilities and helpers
├── hooks/                        # Custom React hooks
├── constants/                    # App constants and config
├── drizzle/                      # Database schema
│   └── schema.ts                 # Table definitions
├── shared/                       # Shared types
├── therapist-apps/               # Related therapist applications
├── tests/                        # Test files
├── app.config.ts                 # Expo configuration
├── drizzle.config.ts             # Drizzle configuration
├── tailwind.config.js            # Tailwind CSS config
├── theme.config.js               # App theme configuration
└── package.json
```

## Key Patterns & Conventions

### Database Changes
1. **Always** update `drizzle/schema.ts` first
2. Run `pnpm db:push` to generate and apply migrations
3. Update query functions in `server/db.ts`

### tRPC API Structure
```typescript
// server/routers.ts
import { router, publicProcedure, protectedProcedure } from './trpc';
import { z } from 'zod';

export const appRouter = router({
  mood: router({
    log: protectedProcedure
      .input(z.object({ mood: z.number(), notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        return ctx.db.insert(moodLogs).values({
          userId: ctx.user.id,
          mood: input.mood,
          notes: input.notes,
        });
      }),
    
    history: protectedProcedure.query(async ({ ctx }) => {
      return ctx.db.select().from(moodLogs).where(eq(moodLogs.userId, ctx.user.id));
    }),
  }),
  
  therapy: router({
    chat: protectedProcedure
      .input(z.object({ message: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return openRouterTherapist.chat(input.message);
      }),
  }),
});
```

### Expo Router Navigation
```typescript
// File-based routing
// app/(tabs)/index.tsx -> /
// app/(tabs)/therapy.tsx -> /therapy
// app/onboarding.tsx -> /onboarding

import { router } from 'expo-router';

// Navigate to a screen
router.push('/therapy');

// Go back
router.back();
```

### NativeWind (Tailwind CSS in React Native)
```typescript
import { View, Text } from 'react-native';

export function Component() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-lg font-semibold text-foreground">
        Hello, MindSpace!
      </Text>
    </View>
  );
}
```

### OpenRouter AI Therapist Service
```typescript
// server/openrouter-therapist-service.ts
export const openRouterTherapist = {
  chat: async (message: string, context?: string) => {
    // Call OpenRouter API with CBT-trained model
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-sonnet',
        messages: [
          { role: 'system', content: CBT_THERAPIST_PROMPT },
          { role: 'user', content: message },
        ],
      }),
    });
    return response.json();
  },
};
```

## Authentication Flow

1. User authenticates via OAuth or email/password
2. Server creates JWT token using `jose`
3. Token stored securely in Expo Secure Store
4. Protected procedures verify token and inject user into context

### Biometric Authentication
```typescript
import * as LocalAuthentication from 'expo-local-authentication';

export async function authenticateWithBiometrics() {
  const { success } = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to access MindSpace',
  });
  return success;
}
```

## Required Environment Variables

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database

# Auth
JWT_SECRET=your-jwt-secret

# OpenRouter (AI Therapist)
OPENROUTER_API_KEY=sk-or-...

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Push Notifications
EXPO_PUSH_TOKEN=...

# Email (SendGrid)
SENDGRID_API_KEY=SG...

# Stream.io (Video)
STREAM_API_KEY=...
STREAM_API_SECRET=...
```

## Change Expectations

### Adding New Features
1. **Plan**: Review design.md for feature specifications
2. **Database**: Update schema if needed, run migrations
3. **Backend**: Create tRPC procedures in `server/routers.ts`
4. **Frontend**: Create screens in `app/(tabs)/` or `app/`
5. **Components**: Build reusable components in `components/`
6. **Test**: Run tests and verify functionality
7. **Format**: Run `pnpm format` before committing

### Code Style
- Use TypeScript for all code
- Use NativeWind (Tailwind CSS classes) for styling
- Follow existing naming conventions
- Use Zod for input validation
- Handle errors gracefully with user-friendly messages

### Mobile-Specific Considerations
- Use `expo-secure-store` for sensitive data
- Implement proper keyboard handling
- Support both iOS and Android platforms
- Handle offline scenarios gracefully
- Use proper loading states and error boundaries

## Testing Guidance

```bash
# Run all tests
pnpm test

# OpenRouter integration tests require OPENROUTER_API_KEY to be set
# (set it in the environment or skip those tests when unavailable)

# Run specific test file
pnpm test server/openrouter.test.ts

# Run with coverage
pnpm test --coverage
```

### Test Structure
```typescript
import { describe, it, expect } from 'vitest';

describe('OpenRouter Therapist', () => {
  it('should respond to user message', async () => {
    const response = await openRouterTherapist.chat('I feel anxious');
    expect(response).toBeDefined();
  });
});
```

## Security Notes

- **Never** store sensitive data in AsyncStorage (use Secure Store)
- Validate all user inputs with Zod schemas
- Implement proper session expiration
- Use HTTPS for all API calls
- Protect API keys - never expose on client
- Implement rate limiting for AI therapist endpoints

## Deployment

### EAS Build
```bash
# Configure EAS
eas build:configure

# Build for Android
eas build --platform android --profile preview

# Build for iOS
eas build --platform ios --profile preview

# Production build
eas build --platform android --profile production
```

### App Store Listings
See `APP_STORE_LISTINGS.md` for store descriptions and metadata.

## Common Issues & Solutions

### Metro Bundler Issues
- Clear Metro cache: `npx expo start --clear`
- Delete node_modules: `rm -rf node_modules && pnpm install`

### iOS Build Issues
- Update pods: `cd ios && pod install`
- Check Xcode version compatibility

### Android Build Issues
- Clean Gradle: `cd android && ./gradlew clean`
- Check Android SDK version

### OpenRouter API Errors
- Verify API key is valid
- Check rate limits
- Ensure model is available

## Accessibility

- Use semantic components (TouchableOpacity, Pressable)
- Provide accessibility labels
- Support screen readers
- Use high contrast colors
- Implement proper focus management

## Agent Workflow Best Practices

### Issue Assignment & Planning
- When assigned an issue, start by thoroughly reading the issue description and all comments
- Review related documentation (design.md, relevant service files, test files)
- Create a clear plan with specific, actionable steps
- Ask clarifying questions in the issue if requirements are ambiguous
- Break down complex tasks into smaller, manageable sub-tasks

### Development Workflow
1. **Branch naming**: Use descriptive branch names like `copilot/feature-name` or `copilot/fix-issue-number`
2. **Incremental changes**: Make small, focused commits with clear messages
3. **Test as you go**: Run tests after each logical unit of work
4. **Document decisions**: Add comments explaining non-obvious implementation choices
5. **Security first**: Never commit secrets, validate inputs, use secure patterns

### Pull Request Guidelines
- **Clear description**: Explain what changes were made and why
- **Link to issue**: Reference the issue number using "Closes #123" or "Fixes #123"
- **Testing evidence**: Include output from tests, linting, and type checking
- **Breaking changes**: Clearly document any breaking changes or migration steps
- **Screenshots**: For UI changes, include before/after screenshots or videos

### Code Review Expectations
- Expect human review on all PRs - never approve or merge your own work
- Address review feedback promptly and respectfully
- If a reviewer suggests changes, implement them or explain why you disagree
- Update the PR description if the scope changes during review
- Rebase or merge main if conflicts arise, don't leave stale PRs

### Quality Standards
- **Zero tolerance for bugs**: Test edge cases, error paths, and happy paths
- **Performance matters**: Avoid unnecessary re-renders, optimize database queries
- **Security critical**: This is a mental health app - treat user data with utmost care
- **Accessibility required**: All UI changes must be accessible (screen readers, keyboard navigation)
- **Mobile-first**: Test on actual devices when possible, consider network conditions

### Communication Guidelines
- Use issue comments to provide status updates
- Tag specific people with @mentions when you need input
- Use GitHub's task lists in issue descriptions to track progress
- If blocked, clearly explain the blocker and what you need to proceed
- Celebrate wins! Acknowledge helpful review feedback

## Integration Testing

### Before Opening a PR
```bash
# Full test suite
pnpm test

# Lint and format check
pnpm lint
pnpm format

# Type checking
pnpm check

# Build verification
pnpm build
```

### Mobile Testing Checklist
- [ ] Test on iOS simulator (if iOS changes)
- [ ] Test on Android emulator (if Android changes)
- [ ] Test with slow network conditions
- [ ] Test with airplane mode / offline
- [ ] Test with different screen sizes
- [ ] Test with accessibility features enabled (VoiceOver, TalkBack)

### Server Testing Checklist
- [ ] API endpoints return correct status codes
- [ ] Error handling works for invalid inputs
- [ ] Database migrations run successfully
- [ ] Authentication/authorization works correctly
- [ ] Rate limiting is enforced where needed

## Common Pitfalls to Avoid

1. **Don't skip tests** - Even "simple" changes can break things
2. **Don't commit node_modules** - Use .gitignore properly
3. **Don't hardcode secrets** - Use environment variables
4. **Don't break existing functionality** - Run the full test suite
5. **Don't ignore TypeScript errors** - Fix them, don't suppress them with @ts-ignore
6. **Don't push directly to main** - Always use PRs
7. **Don't leave debug code** - Remove console.logs and debugging statements
8. **Don't ignore linter warnings** - Fix them or explicitly disable with justification

## Resources & Links

- **Design Reference**: See `design.md` for UI/UX specifications
- **App Store Listings**: See `APP_STORE_LISTINGS.md` for marketing copy
- **Stripe Setup**: See `STRIPE_SETUP.md` for payment integration
- **Integration Guide**: See `INTEGRATION_GUIDE.md` for third-party services
- **Remaining Features**: See `REMAINING_FEATURES.md` for planned work
- **GitHub Copilot Best Practices**: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent

## Emergency Contacts

- **Project Maintainer**: @21leahcimhtiek-oss
- **Report Security Issues**: Use GitHub Security Advisories (private disclosure)
- **Ask Questions**: Open a discussion in GitHub Discussions or comment on your assigned issue

---

**Happy coding!** 🧠 MindSpace - AI-powered mental health support.

*Remember: You're contributing to a mental health app that could help real people. Write code with care, empathy, and attention to detail.*
