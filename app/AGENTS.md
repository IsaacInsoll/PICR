# React Native App Development Guide

Expo/React Native mobile app for PICR, providing gallery viewing and push notifications.

## Tech Stack

| Technology         | Version | Purpose                |
| ------------------ | ------- | ---------------------- |
| Expo               | SDK 54  | React Native framework |
| Expo Router        | 6.0     | File-based navigation  |
| React Native       | 0.81    | Mobile UI              |
| React              | 19.1    | UI framework           |
| URQL               | 4.2     | GraphQL client         |
| Jotai              | 2.12    | State management       |
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
│   │       └── s/[uuid]/       # Public share routes
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
/[loggedin]/s/[uuid]/[folderId]/ # Public share view
```

### Dynamic Segments

- `[loggedin]` - Server hostname extracted from URL
- `[uuid]` - Public share link UUID
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

## Sharing Code with Frontend

### Metro Configuration

```javascript
// metro.config.js
config.resolver.extraNodeModules = {
  '@frontend': __dirname + '/../frontend/src',
  '@shared': __dirname + '/../shared',
};
config.watchFolders = [
  __dirname + '/../frontend/src',
  __dirname + '/../shared',
];
```

### Import Patterns

```typescript
// From shared (GraphQL, utilities)
import { meQuery } from '@shared/urql/queries/meQuery';
import { prettyBytes } from '@shared/prettyBytes';
import { sortFolderContents } from '@shared/files/sortFiles';

// From frontend (limited - no React hooks)
import { formatMetadataValue } from '@frontend/metadata/formatMetadataValue';
```

### What CAN Be Imported

| Source      | What's Safe                                 | What's NOT Safe         |
| ----------- | ------------------------------------------- | ----------------------- |
| `@shared`   | Types, queries, pure functions, Jotai atoms | URQL hooks              |
| `@frontend` | Pure formatting functions                   | React hooks, components |

Any attempt to import from @frontend should trigger a "should this be refactored to be in @shared" consideration.

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

## Authentication

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
export async function registerForPushNotifications() {
  // 1. Check if physical device (not simulator)
  // 2. Request permissions
  // 3. Get Expo push token
  // 4. Register with backend via editUserDevice mutation
}
```

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

### Push notifications not working

1. Check device is physical (not simulator)
2. Check permissions granted
3. Check token registered with backend (`userDevices` query)
4. Check notification channel exists (Android)

### Navigation issues

1. Check route file is in correct location
2. Check dynamic segment names match usage
3. Check `router.push` vs `router.replace` for desired behavior

### Images not loading

1. Check server URL is correct
2. Check auth token is valid
3. Check network connectivity
4. Clear image cache in settings
