# Echo

> Cross-Device Notification Forwarding & Reply (Android → Windows)

## Monorepo Structure

- `apps/desktop`: Electron + React + TypeScript tray app with custom toast reply & missed inbox UI.
- `apps/mobile`: React Native (Expo SDK 52) + TypeScript mobile companion with Kotlin native bridge for `NotificationListenerService` and `RemoteInput`.
- `packages/shared-types`: Canonical Zod schemas and TypeScript definitions for notifications, replies, pairing, and device heartbeats.
- `packages/crypto`: Utilities for QR pairing payload encoding, decoding, and temporary pairing codes.
- `packages/firebase-client`: Centralized Firestore & Auth client wrapper for real-time syncing and TTL management.
- `packages/tsconfig`: Shared TypeScript compiler configurations (`base.json`, `electron.json`, `react-native.json`).
- `packages/eslint-config`: Shared ESLint rules and TypeScript linting.

## Development

```bash
bun install
bun run dev
bun run typecheck
```
