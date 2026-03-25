# Copilot Instructions for MindSpace

Guidance for Copilot coding agents working in this repository.

## Stack Snapshot
- Client: React Native 0.81 with Expo SDK 54, Expo Router 6, NativeWind (Tailwind classes).
- Server: Express + tRPC 11, Drizzle ORM (MySQL).
- Tooling: TypeScript 5.9, esbuild/vite, pnpm (via corepack).
- Integrations: Stripe, OpenRouter, Expo Notifications, Stream Video.

## Primary Commands
- Install deps: `corepack pnpm install`
- Lint: `corepack pnpm lint`
- Type check: `corepack pnpm check`
- Tests: `corepack pnpm test` (OpenRouter integration tests need `OPENROUTER_API_KEY`; set it or skip that file)
- Dev servers: `corepack pnpm dev` or `corepack pnpm dev:server` + `corepack pnpm dev:metro`
- Build: `corepack pnpm build`
- Format: `corepack pnpm format`
- DB migrate: `corepack pnpm db:push`

## Repo Map
- `app/`: Expo Router screens; `(tabs)/` for main tabs, `_layout.tsx` for routing shell.
- `components/`: shared UI primitives; styling via `className` and NativeWind tokens.
- `server/`: Express + tRPC handlers, services, and Vitest files.
- `drizzle/`: schema definitions; update here before DB changes.
- `tests/`: additional Vitest suites; `lib/`, `hooks/`, `constants/`, `shared/` provide utilities and types.

## Conventions
- Write TypeScript; prefer functional components and NativeWind classes over inline styles.
- Navigation uses `expo-router` (`router.push`, `router.replace`, `router.back`).
- Validate inputs with Zod in tRPC procedures; return friendly errors.
- Database: edit `drizzle/schema.ts` first, then run `pnpm db:push`, and update `server/db.ts` queries.
- Secrets: use Expo Secure Store on device; never store secrets in AsyncStorage or commit `.env` values.
- Payments and AI: route through `server/stripe-service.ts` and `server/openrouter-therapist-service.ts`; do not expose keys client-side.

## Testing Notes
- Vitest is the default; networked OpenRouter tests require `OPENROUTER_API_KEY` (otherwise skip).
- Keep new tests close to the code under test (e.g., `server/*.test.ts` or `tests/`).

## Boundaries and Safety
- Do not modify `.github/agents/` or commit generated secrets/build artifacts.
- Keep accessibility in mind (labels, readable contrast) and handle offline/error states gracefully.

## References
- `design.md`, `REMAINING_FEATURES.md`, and `todo.md` outline feature goals and priorities.
