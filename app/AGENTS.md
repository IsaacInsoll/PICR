# React Native App Development Guide

Expo/React Native mobile app for PICR, providing gallery viewing and push notifications.

Long-term app cleanup, upgrades, and monorepo work are tracked in
[`modernization-roadmap.md`](./modernization-roadmap.md).

`@rnrepo/expo-config-plugin` is intentionally pinned to `0.1.0-beta.0`. A caret
range also admits `0.1.0-beta.1`, whose published peer dependency supports Expo
54 rather than the app's Expo 55 baseline; normal npm resolution and
`npm audit fix` then fail with `ERESOLVE`. Reassess or remove the plugin during
the SDK 56 upgrade rather than widening this prerelease range.

After applying the current SDK 55 patches and safe `npm audit fix` updates,
`npm audit --omit=dev` retains 11 moderate advisories in Expo's
build/configuration toolchain through `@expo/config-plugins` → `xcode` →
`uuid`. The full audit reports one additional path through the SDK-matched
`jest-expo` development dependency. npm's force-fix suggestion is an invalid
downgrade to Expo 46. Do not use `npm audit fix --force` for these; reassess them
as part of the SDK 56 and 57 upgrades.

Keep `@gorhom/bottom-sheet` at 5.2.7 or newer on React Native's New
Architecture. Version 5.2.6 calls an undefined
`unstable_getBoundingClientRect`; upstream added the required function guard in
5.2.7 and strengthened it in 5.2.10. The app currently pins the range from
5.2.14, which contains both fixes. Do not patch this hook in `node_modules`.

## Tech Stack

| Technology         | Version | Purpose                |
| ------------------ | ------- | ---------------------- |
| Expo               | SDK 55  | React Native framework |
| Expo Router        | 55.0    | File-based navigation  |
| React Native       | 0.83    | Mobile UI              |
| React              | 19.2    | UI framework           |
| URQL               | 5.0     | GraphQL client         |
| Jotai              | 2.17    | State management       |
| Expo Notifications | -       | Push notifications     |

## Directory Structure

```
app/
├── src/
│   ├── app/                    # Expo Router routes (file-based)
│   │   ├── _layout.tsx         # Root layout
│   │   ├── login/              # Login screen
│   │   └── [loggedin]/         # Authenticated routes
│   │       ├── admin/          # Admin views
│   │       │   ├── f/[folderId]/ # Folder view
│   │       │   └── settings.tsx
│   ├── components/             # React Native components
│   │   ├── FolderContents/     # Gallery views
│   │   ├── Menus/              # Sort/filter bottom sheets
│   │   └── chips/              # Rating, flag badges
│   ├── hooks/                  # Custom hooks
│   ├── helpers/                # Utilities
│   ├── atoms/                  # Jotai state
│   ├── constants.ts            # Colors, fonts
│   └── app-shared/             # Duplicated hooks (see Known Issues)
├── app.config.ts               # Expo configuration
├── metro.config.js             # Metro bundler config
└── tsconfig.json               # TypeScript config
```

## Navigation (Expo Router)

File-based routing - file structure = URL structure.

### Route Structure

```
/login                           # Login screen
/[loggedin]/admin/               # Dashboard (loggedin = hostname)
/[loggedin]/admin/f/[folderId]/  # Folder view
/[loggedin]/admin/f/[folderId]/[fileId]/  # File viewer
/[loggedin]/admin/settings       # Settings
```

### Dynamic Segments

- `[loggedin]` - Server hostname extracted from URL
- `[folderId]` - Folder ID
- `[fileId]` - File ID

### Navigation Example

```typescript
import { router } from 'expo-router';

// Navigate to folder
router.push(`/${hostname}/admin/f/${folderId}`);

// Navigate with params
router.push({
  pathname: '/[loggedin]/admin/f/[folderId]',
  params: { loggedin: hostname, folderId },
});

// Go back
router.back();
```

## Sharing Code with Shared

### Metro Configuration

```javascript
// metro.config.js
config.resolver.extraNodeModules = {
  '@shared': __dirname + '/../shared',
};
config.watchFolders = [__dirname + '/../shared'];
```

### Import Patterns

```typescript
// From shared (GraphQL, utilities)
import { meQuery } from '@shared/urql/queries/meQuery';
import { prettyBytes } from '@shared/prettyBytes';
import { sortFolderContents } from '@shared/files/sortFiles';
```

### What CAN Be Imported

| Source    | What's Safe                       | What's NOT Safe         |
| --------- | --------------------------------- | ----------------------- |
| `@shared` | Types, queries and pure functions | Jotai atoms, URQL hooks |

The app must not import from `frontend`, `backend`, or any other non-shared
subsystem. Move code needed by multiple consumers into `shared/` and import it
with `@shared/*`.

The app directly provides `graphql` because `@shared/urql/urqlClient` imports
GraphQL runtime values. Metro resolving a transitive copy from
`shared/node_modules` is not a dependency contract and can break after an npm
hoisting change.

## Known Issues / Tech Debt

### `app-shared/` Duplicated Hooks

**Problem**: Some hooks are duplicated in `src/app-shared/` instead of imported from `@shared`.

**Reason**: Metro bundler has issues with URQL hook instances across the monorepo. Importing hooks from shared causes "useEffect on null" errors.

**Workaround**: The `useRequery` hook and potentially others are copied to `app-shared/`.

**Future Fix**: This should be resolved by either:

1. Proper monorepo tooling (e.g., Turborepo)
2. Extracting URQL client creation to app-specific code
3. Waiting for Expo/Metro improvements

**Note**: This is a known issue to fix when time permits.

The root cause is not only Metro configuration. With the current separate
package installs, `app/node_modules` and `shared/node_modules` contain distinct
React/URQL/Jotai instances; a React hook imported from `shared` therefore uses a
different React instance from the app renderer. In addition,
`shared/hooks/useRequery.tsx` is browser-specific because it reads
`document.visibilityState`, while the app copy polls without that browser API.
Do not replace the app copy with the shared hook merely because a workspace or
task runner has been introduced. First deduplicate compatible runtime packages
and move platform-specific polling/visibility behavior behind consumer-owned
adapters.

Until that deduplication is complete, keep app-owned Jotai atoms under
`app/src/atoms`. Importing an atom from `shared` also evaluates shared's Jotai
package and causes Metro to load two default stores, producing the "Detected
multiple Jotai instances" warning and potentially splitting state.

Use `expo-image` for rendered images and set an explicit cache policy when the
screen depends on caching. Do not reintroduce `CachedImage` from
`@georstat/react-native-image-cache`: its component reads the library's static
configuration during render, and layout/bootstrap failures can leave that
configuration undefined. The old package remains temporarily for cache-manager
APIs used by full-screen images and settings until that path is migrated too.

### Photographer-only route boundary

The native route tree contains authenticated photographer/admin screens only.
Public `/s/:uuid/...` gallery URLs belong to the frontend and must open in the
system browser. Keep this distinction in `src/helpers/appRoutes.ts`; do not
reintroduce public providers, UUID-aware component branches or partial public
routes without treating native client galleries as a complete product surface.
Incoming authenticated links must match an exact native route shape; a generic
`/admin` prefix is not an allowlist because the web frontend has additional
admin routes that the app does not implement. Keep the accepted path matcher,
Expo Router file tree and `appRoutes` tests in sync.

The app uses `shared/urql/queries/appMeQuery.ts` and projects it through
`src/helpers/appMe.ts`. Keep that contract limited to authenticated
photographer identity and app configuration. The broader shared `meQuery`
intentionally includes public-link fields such as `uuid`, `commentPermissions`
and `linkMode` because the web frontend still supports client galleries; do not
reuse it in the photographer-only app merely to avoid a separate operation.

`src/helpers/authenticatedServerOrigin.ts` is the single contract for server URL
normalization, the native route key, authenticated GraphQL headers and full
media URLs. `PicrUserProvider` publishes the authenticated value through
`AuthenticatedServerOriginProvider`; authenticated descendants must consume
that context instead of reading `LoginDetails.server`, deriving a hostname from
Expo Router parameters, or concatenating media paths themselves. Code outside
the authenticated route provider, such as startup and incoming-notification
handling, may create the same pure origin from stored login details.

The route key is only `host[:port]`; the HTTP base path remains in `baseUrl` and
is applied to GraphQL and media requests. Incoming authenticated and public
gallery links must remove that known base path before matching native routes,
while browser-bound gallery URLs retain it. Preserve the explicit `http:` or
`https:` scheme. Plain HTTP is best-effort compatibility for deliberate
self-hosted development setups, not a release gate: do not silently upgrade it
to HTTPS, but do not add platform-specific cleartext exceptions unless a real
use case justifies their maintenance. HTTPS is the supported default.

## Authentication

The backend accepts arbitrary non-empty admin usernames and its default
username is `admin`. Do not validate the app login username as an email address.

The current backend returns an empty auth token for invalid credentials and
rate-limited attempts. `appLogin` converts that response into a typed local
`authentication_rejected` result and classifies transport failures through
URQL's `networkError`; `LoginForm` must not recover error state by comparing
display strings. A future machine-readable login error contract is core PICR
API work and requires explicit approval outside routine app modernization.

### Secure Storage

```typescript
import * as SecureStore from 'expo-secure-store';

// Credentials stored securely on device
await SecureStore.setItemAsync('server', serverUrl);
await SecureStore.setItemAsync('token', jwtToken);
```

### Login Flow

1. User enters server URL, username, password
2. App creates URQL client with server URL
3. Executes login mutation
4. Stores token in SecureStore
5. Navigates to authenticated routes

### Auth Context (`PicrUserProvider`)

```typescript
// Wraps authenticated routes
// Loads credentials from device
// Creates URQL client with Bearer token
// Redirects to /login if not authenticated
```

## Push Notifications

### Setup

```typescript
// helpers/pushNotifications.ts
await checkPushNotificationRegistrationAsync(); // Never prompts
await registerForPushNotificationsAsync(); // May prompt after explicit opt-in
```

Opening Notification Settings must only check existing local permission. Request
permission from an explicit user action, such as enabling the notification
switch. The helpers return a structured registration status; an exception or
configuration error is not a push token and must not be sent to the backend.
Expo push tokens remain unavailable on simulators.

### Deep Linking

Push notifications include URLs that deep link into the app:

```typescript
// Server sends: https://picr.example.com/admin/f/123
// App transforms to: picr://admin/f/123
// Expo Router handles navigation
```

### Notification Handling

```typescript
// In _layout.tsx
<NotificationsResponseListener />

// Listens for:
// - Notifications received while app is open
// - User tapping on notification
// - App launched via notification (cold boot)
```

## Platform Differences

### iOS vs Android

| Feature       | iOS                             | Android                   |
| ------------- | ------------------------------- | ------------------------- |
| Header        | Transparent + blur              | Solid background          |
| Context menus | `react-native-ios-context-menu` | `@react-native-menu/menu` |
| Safe area     | Different nav bar handling      | Edge-to-edge UI           |
| Status bar    | Adapts to content               | Fixed style               |

### Platform-Specific Code

```typescript
import { Platform } from 'react-native';

const headerStyle =
  Platform.OS === 'ios'
    ? { backgroundColor: 'transparent' }
    : { backgroundColor: colors.background };
```

## UI Components

### Primitives

```typescript
// Custom themed primitives
import { PView, PText, PTitle } from '../components/primitives';

<PView>
  <PTitle>Folder Name</PTitle>
  <PText>10 photos</PText>
</PView>
```

### View Modes

```typescript
type ViewMode = 'list' | 'feed' | 'gallery' | 'gallery2';

// list     - Vertical file list
// feed     - Image feed (slideshow-like)
// gallery  - 2-column grid
// gallery2 - 3-column grid
```

### Bottom Sheets

```typescript
import BottomSheet from '@gorhom/bottom-sheet';

// Used for:
// - Sort/filter options
// - File comments
// - File info
```

## Theme System

```typescript
// constants.ts
export const colors = {
  light: {
    background: '#ffffff',
    text: '#000000',
    brand: '#1C4B4F',
    dimmed: '#666666',
  },
  dark: {
    background: '#1a1a1a',
    text: '#ffffff',
    brand: '#2F8084',
    dimmed: '#999999',
  },
};

// Usage
import { useAppTheme } from '../hooks/useAppTheme';

function MyComponent() {
  const { colors, isDark } = useAppTheme();
  return <View style={{ backgroundColor: colors.background }} />;
}
```

## Adding a New Screen

1. Create file in `src/app/` following route structure:

   ```typescript
   // src/app/[loggedin]/admin/my-screen.tsx
   export default function MyScreen() {
     return (
       <PView>
         <PTitle>My Screen</PTitle>
       </PView>
     );
   }
   ```

2. Screen is automatically available at `/:hostname/admin/my-screen`

3. Add navigation if needed:
   ```typescript
   router.push(`/${hostname}/admin/my-screen`);
   ```

## Adding a New Component

```typescript
// src/components/MyComponent.tsx
import { View, Text, StyleSheet } from 'react-native';

interface MyComponentProps {
  title: string;
}

export function MyComponent({ title }: MyComponentProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});
```

## Development Workflow

### Regenerate native projects after dependency changes

`android/` and `ios/` are ignored Continuous Native Generation output. Expo's
`run:android`/`run:ios` commands generate a native directory only when it is
absent; they do not fully refresh an existing project after an Expo or native
dependency update. Run the relevant clean prebuild first:

```bash
npx expo prebuild --clean --platform android
npx expo prebuild --clean --platform ios
```

Do not patch generated entry points such as `MainApplication.kt` to work around
SDK drift. For example, the pre-SDK-55 Android output referenced the removed
`ReactNativeHostWrapper`; clean SDK 55 output uses `ExpoReactHostFactory`.
Express intentional native customization in `app.config.ts` or a config plugin
so it survives regeneration.

### Running the App

```bash
cd app

# Development build (requires native build first)
npx expo start

# iOS simulator
npx expo start --ios

# Android emulator
npx expo start --android
```

### Building for Production

```bash
# Android
npx expo export --platform android

# iOS (macOS only)
npx expo export --platform ios

# EAS Build (cloud)
eas build --platform ios
eas build --platform android
```

### Debugging

```bash
# Open React Native debugger
npx expo start --dev-client

# View logs
npx expo start --clear  # Clear cache first
```

The full-screen file viewer uses a custom `react-native-reanimated-carousel`
animation behind a transparent navigation header. Keep its translation mapping
symmetric: carousel values `-1`, `0`, and `1` must map to `-width`, `0`, and
`width`, and the active item must have the highest `zIndex`. A half-width
mapping leaves the neighbouring item's dimming mask visible through transparent
header and image-letterbox areas as an exact half-screen grey overlay.

## Validation Commands

Jest is configured with `watchman: false`. Keep this setting: containerized and
sandboxed development environments can expose a Watchman binary whose state
directory is read-only, causing tests to crash before discovery. Jest's Node
filesystem crawler is sufficient for the app test suite and behaves the same in
local checks and CI.

App unit and component tests live in `app/tests/`, never under `app/src/app/`:
Expo Router treats every file below its route root as a route. The app uses
React Native Testing Library 14 with `test-renderer` 1.2 for React 19.2. Its
render and interaction APIs are asynchronous, so await `render`, `userEvent`,
`fireEvent`, rerenders and unmounts. Run the suite with `npm test` from `app/`.

Use `userEvent` for realistic text entry, but prefer `fireEvent.press` when a
test only needs to exercise a button's semantic callback. `userEvent.press`
also emits `pressIn`/`pressOut`; React Native buttons and React Navigation
header buttons then start native-driver opacity animations which can fail in a
containerized test renderer with “Unable to locate attached view in the native
tree.” Native animation behavior belongs in the Maestro/device layer.

Jest maps `@expo/vector-icons` to the small app-owned mock under
`app/tests/mocks/`. Expo SDK 55 installs `expo-asset` beneath `expo` rather than
at the app package root; Node/Jest cannot resolve that transitive sibling when
the real vector-icon module loads `expo-font`, even though Metro exports resolve
the SDK module graph correctly. Keep the mock focused on interaction semantics
instead of adding a redundant direct runtime dependency solely for Jest.

The local Maestro flow lives in `app/.maestro/` and targets stable `testID`
values rather than visible English labels. It runs against the separately
installable development variant by default and receives credentials only via
`MAESTRO_*` environment variables. Do not add real credentials to flow files or
spend an EAS build merely to run the local smoke test.

Root-level Maestro YAML files are independently runnable tests; reusable login
and home-folder setup belongs under `app/.maestro/subflows/`, which Maestro does
not discover when running the workspace with its default root-only pattern.
Each root flow must start through the login subflow so suite order never matters.
The download flow changes the device media library, while comment and physical-
device notification flows mutate the configured server; keep those effects
explicit in `app/.maestro/README.md` and use a dedicated test account.

Maestro flows default to the separate `com.isaacinsoll.picr.dev` package and
clear its app state before login. A plain local Expo Android build may instead
install `com.isaacinsoll.picr`; verify with `adb shell pm list packages` and set
`MAESTRO_APP_ID=com.isaacinsoll.picr` only when clearing that package's local
state is acceptable.

Clearing a development client's state also removes its remembered Metro project
and exposes the Expo launcher. Run Maestro through the app's npm scripts: the
`scripts/run-maestro.mjs` wrapper retrieves Expo SDK 55's development-client
redirect from the active local Metro server and supplies it to the login
subflow. Set `MAESTRO_EXPO_PORT` when Metro does not use 8081, or
`MAESTRO_DEV_CLIENT_URL` to override discovery with a complete launch URI.

Expo push tokens require a physical device. The notification flow must accept
the app's explicit `notification-toggle-unavailable` state on emulators while
still exercising the mutation when `notification-toggle` becomes available on
a physical device.

The app lint script must remain `expo lint -- --max-warnings=0`. The separator
forwards the warning option through Expo to ESLint; without it Expo silently
consumes the option and the zero-warning gate becomes ineffective.

Run these after app changes:

```bash
cd app && npm run lint
cd app && npx tsc --noEmit
cd app && npm test
cd app && npx expo export --platform android
```

Also run repo-wide formatting checks:

```bash
npm run format:check
```

For test validation, ask the user to run:

```bash
npm run workflow
```

## Troubleshooting

### Metro bundler errors

```bash
# Clear Metro cache
npx expo start --clear

# Reset completely
rm -rf node_modules/.cache
npm install
```

### "useEffect on null" errors

Usually means a hook is being imported from shared incorrectly. Check if the hook needs to be in `app-shared/` instead.

### `Intl.RelativeTimeFormat` crashes on Hermes

Hermes does not currently provide the complete Intl chain needed by
`RelativeTimeFormat`. It can expose missing APIs with `undefined` values, which
crashes FormatJS's capability-detecting entrypoints. The app must force-install
`getCanonicalLocales`, `Locale`, `PluralRules`, and `RelativeTimeFormat` in that
order, with `PluralRules` locale data loaded before relative-time locale data.
The static `el`, `en`, and `fr` imports live in `src/polyfills.ts`, imported first
by the root layout. When adding an app language, add both locale-data imports and
the assertion in `scripts/check-polyfills.mjs`. Keep the fallback in
`shared/i18n/formatting.ts`: shared helpers must degrade to an absolute date when
the API is absent or a partial polyfill has not loaded locale data.

### Push notifications not working

1. Check device is physical (not simulator)
2. Check permissions granted
3. Check token registered with backend (`userDevices` query)
4. Check notification channel exists (Android)

### Navigation issues

1. Check route file is in correct location
2. Check dynamic segment names match usage
3. Check `router.push` vs `router.replace` for desired behavior

If TypeScript rejects a tracked Expo Router path that exists on disk, inspect
`.expo/types/router.d.ts`. This ignored, generated cache can predate a newer
route and make local type checking fail even though a clean CI checkout passes.
Move or delete the stale declaration and rerun the type check; `npx expo start`
will regenerate it when needed. Do not weaken the route type or cast the valid
path to work around stale generated state.

The native app is photographer/admin-only. Do not add Expo Router routes for
frontend client galleries under `/s/:uuid/...` or restore UUID-aware branches
to `AppFolderLink`. `src/helpers/appRoutes.ts` is the boundary for incoming
links: authenticated `/admin/...` targets may become native routes, `/s/...`
targets must open their HTTP(S) frontend URL, and unrelated notification URLs
must be ignored. Preserve explicit `http://` gallery URLs for deliberately
configured plain-HTTP self-hosted servers.

### Images not loading

1. Check server URL is correct
2. Check auth token is valid
3. Check network connectivity
4. Clear image cache in settings

Media URL helpers must encode the final filename path segment with
`encodeURIComponent`. Keep fixed video artifact names such as `poster.jpg`
unchanged.

The native app targets the current PICR GraphQL API; it does not negotiate with
older server schemas. Generated thumbnail and video-poster URLs must use the
server-published `clientInfo.thumbnailVariants` tokens selected through
`src/helpers/thumbnailRouteSize.ts`. Do not fabricate a token from shared
defaults: JPEG quality is part of the token and a server configured at another
quality will return 404 for it. Raw media continues to use the `raw` route.

Keep the pure route builder in `src/helpers/imageURL.ts` so image, video,
full-screen and download paths share filename encoding and can be tested without
rendering a React Native component.

Backend tasks may omit `step` and `totalSteps` for indeterminate activity such
as media scanning. Task UI must not render a percentage unless both values are
numbers and `totalSteps` is positive; `step = 0` is valid determinate progress.
