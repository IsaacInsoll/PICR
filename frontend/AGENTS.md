# Frontend Development Guide

React 19 SPA for the PICR admin interface and public gallery views.

## Tech Stack

| Technology   | Version | Purpose                 |
| ------------ | ------- | ----------------------- |
| React        | 19.1    | UI framework            |
| React Router | 7.5     | Routing                 |
| Mantine      | 7.x     | UI component library    |
| Jotai        | 2.10    | Atomic state management |
| URQL         | 4.2     | GraphQL client          |
| Vite         | 6.4     | Build tool              |
| TypeScript   | 5.6     | Type safety             |

## Directory Structure

```
frontend/src/
├── atoms/              # Jotai state atoms
├── components/         # Reusable UI components
│   ├── FileListView/   # File grid, list, table views
│   │   ├── FileInfo/   # File metadata modal
│   │   ├── Filtering/  # Search, rating, flag filters
│   │   ├── Review/     # Rating, flagging, comments
│   │   └── SelectedFile/ # Lightbox viewer
│   ├── FolderHeader/   # Folder title and actions
│   ├── Header/         # Main navigation
│   └── QuickFind/      # Search modal
├── helpers/            # Utility functions
├── hooks/              # Custom React hooks
├── metadata/           # EXIF/metadata formatting
├── pages/              # Route page components
│   └── management/     # Admin settings pages
├── urql/               # GraphQL client config
└── theme.tsx           # Mantine theme config
```

## Routing

React Router v7 with these main routes:

```typescript
// Public gallery (Link users)
/s/:uuid/:folderId/:fileId?/:tab?

// Admin routes (authenticated)
/admin                          // Dashboard
/admin/f/:folderId/:fileId?/:tab?  // Folder view
/admin/settings/:tab?/:slug?    // Settings pages

// Root redirects to /admin
```

### Route Parameters

```typescript
interface FolderRouteParams {
  folderId: string;
  fileId?: string; // Can also be 'manage' or 'activity'
  tab?: string;
}
```

## State Management (Jotai)

Jotai provides atomic state - small, independent pieces of state.

### Key Atoms

```typescript
// atoms/authAtom.ts - Persisted auth token
export const authKeyAtom = atomWithStorage('auth', '');

// atoms/themeModeAtom.ts - Current theme/branding
export const themeModeAtom = atom<BrandingType>(defaultBranding);

// atoms/modalTypeAtom.ts - URL-synced modal state
export const modalTypeAtom = atomWithHash<ModalType>('m', null);

// atoms/fileSortAtom.ts - URL-synced sort preferences
export const fileSortAtom = atomWithHash('s', { sort: 'f', direction: '' });
```

### URL-Based State with `atomWithHash`

Modal and filter state stored in URL hash for bookmarkable/shareable URLs:

```typescript
// URL: /admin/f/123#m=comments-456
// Opens comments modal for file 456

import { atomWithHash } from 'jotai-location';

// State syncs bidirectionally with URL hash
const modalTypeAtom = atomWithHash<ModalType>('m', null, atomWithHashOptions);
```

### Using Atoms

```typescript
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { authKeyAtom } from '../atoms/authAtom';

// Read only
const authKey = useAtomValue(authKeyAtom);

// Write only
const setAuthKey = useSetAtom(authKeyAtom);

// Read and write
const [authKey, setAuthKey] = useAtom(authKeyAtom);
```

## GraphQL with URQL

### Client Setup

```typescript
// urql/urqlClient.ts
export const picrUrqlClient = (headers: HeadersInit) => {
  return new Client({
    url: '/graphql',
    suspense: true, // Enable React Suspense
    exchanges: [urqlCacheExchange, fetchExchange],
    fetchOptions: () => ({ headers }),
  });
};
```

### Queries

```typescript
import { useQuery } from 'urql';
import { viewFolderQuery } from '@shared/urql/queries/viewFolderQuery';

function FolderView({ folderId }: Props) {
  const [result] = useQuery({
    query: viewFolderQuery,
    variables: { folderId },
    pause: !folderId,  // Don't run if no folderId
  });

  if (result.fetching) return <Loading />;
  if (result.error) return <Error error={result.error} />;

  const folder = result.data?.folder;
  // ...
}
```

### Mutations

```typescript
import { useMutation } from 'urql';
import { addCommentMutation } from '@shared/urql/mutations/addCommentMutation';

function CommentForm({ fileId }: Props) {
  const [, executeMutation] = useMutation(addCommentMutation);

  const handleSubmit = async (comment: string) => {
    const result = await executeMutation({ fileId, comment });
    if (result.error) {
      // Handle error
    }
  };
}
```

### Cache Invalidation

The cache exchange in `urqlCacheExchange.ts` auto-invalidates on mutations:

```typescript
updates: {
  Mutation: {
    editUser: (_, args, cache) => invalidateQueries(cache, ['folder']),
    addComment: (_, args, cache) => invalidateQueries(cache, ['comments']),
    // ...
  },
},
```

Consider invalidating the appropriate "list" query when adding or removing an item. Updates to an existing item should be handled automatically without doing this.

## UI Components (Mantine)

### Theme Configuration

```typescript
// theme.tsx
const theme = createTheme({
  fontFamily: 'Roboto, sans-serif',
  headings: { fontFamily: 'Signika, sans-serif' },
  primaryColor: 'blue', // Overridden per-folder via branding
});
```

### Common Patterns

```typescript
// Use Mantine components directly
import { Button, TextInput, Stack, Group } from '@mantine/core';

// Use Mantine hooks
import { useMediaQuery, useHover, useDisclosure } from '@mantine/hooks';

// Responsive design
import { useIsMobile } from '../hooks/useIsMobile';

function MyComponent() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileView /> : <DesktopView />;
}
```

### Custom "Picr" Components

Wrappers that integrate Mantine with React Router:

```typescript
// PicrLink - Mantine Anchor + React Router NavLink
<PicrLink to={`/admin/f/${folderId}`}>View Folder</PicrLink>

// PicrMenuItem - Mantine Menu.Item + NavLink
<PicrMenuItem to="/admin/settings">Settings</PicrMenuItem>
```

## Custom Hooks

### `useMe()` - Current User

```typescript
import { useMe } from '../hooks/useMe';

function Header() {
  const { user, isAdmin, isLink, commentPermissions, linkMode } = useMe();

  if (!user) return <LoginPrompt />;
  // ...
}
```

### `useIsMobile()` / `useIsSmallScreen()`

```typescript
import { useIsMobile, useIsSmallScreen } from '../hooks/useIsMobile';

function Gallery() {
  const isMobile = useIsMobile();      // < 768px
  const isSmall = useIsSmallScreen();  // < 480px

  return isMobile ? <CompactGallery /> : <FullGallery />;
}
```

## File Organization Patterns

### Component Files

```
ComponentName/
├── ComponentName.tsx       # Main component
├── ComponentName.module.css # Scoped styles (optional)
├── SubComponent.tsx        # Child components
└── index.ts               # Barrel export (if needed)
```

### Naming Conventions

| Type            | Convention               | Example             |
| --------------- | ------------------------ | ------------------- |
| Component files | PascalCase               | `FolderView.tsx`    |
| Hook files      | camelCase with use       | `useIsMobile.ts`    |
| Utility files   | camelCase                | `formatDate.ts`     |
| Atom files      | camelCase + Atom         | `authAtom.ts`       |
| CSS modules     | ComponentName.module.css | `Header.module.css` |

## Error Handling

### Error Boundary

```typescript
import { PicrErrorBoundary } from './components/PicrErrorBoundary';

<PicrErrorBoundary>
  <RiskyComponent />
</PicrErrorBoundary>
```

### GraphQL Error Handling

```typescript
import { QueryFeedback } from './components/QueryFeedback';

function MyComponent() {
  const [result] = useQuery({ query });

  // Handles loading, error, and empty states
  return (
    <QueryFeedback result={result}>
      {(data) => <ActualContent data={data} />}
    </QueryFeedback>
  );
}
```

### Auth Errors

Auth handling should use structured GraphQL error metadata:

- Use `extensions.code` (`UNAUTHENTICATED` / `FORBIDDEN` / `BAD_USER_INPUT`) and `extensions.reason` (for example `NOT_LOGGED_IN`, `ACCESS_DENIED`, `INVALID_LINK`)
- Do not rely on error message string matching for auth decisions
- Global overlay logic should dedupe to a single visible error state, even when polling queries fail repeatedly
- Use shared constants from `shared/auth/authErrorContract.ts` instead of redefining reason strings in frontend code
- Policy matrix for overlay vs local handling: `docs/global-error-policy.md`

## Adding a New Page

1. Create component in `pages/`:

   ```typescript
   // pages/MyNewPage.tsx
   export function MyNewPage() {
     return <div>My New Page</div>;
   }
   ```

2. Add route in `Router.tsx`:

   ```typescript
   <Route path="/admin/my-new-page" element={<MyNewPage />} />
   ```

3. Add navigation link if needed:
   ```typescript
   <PicrLink to="/admin/my-new-page">My Page</PicrLink>
   ```

## Adding a New Component

1. Create in `components/`:

   ```typescript
   // components/MyComponent.tsx
   interface MyComponentProps {
     title: string;
     onClick?: () => void;
   }

   export function MyComponent({ title, onClick }: MyComponentProps) {
     return (
       <Button onClick={onClick}>
         {title}
       </Button>
     );
   }
   ```

2. Use TypeScript interfaces for props (not `type`)
3. Use functional components with hooks
4. Destructure props in function signature

## Branding System

Branding is a named preset (stored in the `Brandings` DB table) that controls gallery appearance. It cascades from parent folders to children unless overridden.

### Key Files

| File                                                    | Purpose                                                                                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `atoms/themeModeAtom.ts`                                | `themeModeAtom` Jotai atom holds the active `Branding`; `applyBrandingDefaults` fills null fields                         |
| `pages/management/BrandingDrawer.tsx`                   | Slide-out drawer that edits branding live via `themeModeAtom`; calls `editBrandingMutation` on save                       |
| `pages/management/BrandingForm.tsx`                     | Full branding editor — `BrandingInput` interface is the canonical form state type                                         |
| `components/GalleryFooter.tsx`                          | Renders footer title/URL + social links; reads from `themeModeAtom`                                                       |
| `components/FolderBanner.tsx`                           | Full-width banner image at top of folder (above title); admin overlay to clear it                                         |
| `components/SocialLinkIcon.tsx`                         | Maps `SocialLinkTypeKey` → Tabler icon                                                                                    |
| `components/FileListView/GridGallery.tsx`               | Reads `thumbnailSize`, `thumbnailSpacing`, `thumbnailBorderRadius` from `themeModeAtom`                                   |
| `components/FileListView/FolderContentsView.tsx`        | Enforces `availableViews` / `defaultView` for link users (reads `folder.branding` directly — access control, not display) |
| `components/FolderHeader/FolderHeader.tsx`              | Applies `headingFontSize` and `headingAlignment` from `themeModeAtom` to `<Title>`                                        |
| `components/FileListView/Review/SetHeroImageButton.tsx` | Purple icon button that opens a menu to set hero image or banner image                                                    |
| `components/FileListView/FileMenu.tsx`                  | Context menu for list/table view; includes "Set as Banner Image" for admin users                                          |

### Live Preview Pattern (frontend only)

**Display components must read from `themeModeAtom`, not from `folder.branding` props.** This is what enables live preview in `BrandingDrawer` — the drawer updates the atom on every field change, so all visual components reflect edits instantly without a round-trip.

The data flow is:

1. `ViewFolder` reads GraphQL → calls `applyBrandingDefaults(branding)` → writes to `themeModeAtom`
2. `BrandingDrawer` (while open) overrides the atom with live-edited values via its own `useEffect`
3. On cancel, `BrandingDrawer` resets the atom to the original value from `originalTheme.current`
4. On save, the mutation persists the change; GraphQL re-fetch updates the atom via step 1

**Rule:** if a component renders a branding field visually, it reads from `themeModeAtom`. If it uses branding for access control or configuration logic (e.g. `availableViews`, `defaultView`, management UI), it may read `folder.branding` directly.

The mobile app has no branding editor, so it does not use `themeModeAtom` and may read branding from GraphQL data directly.

### Context Gating

| Setting                                    | Admin                     | Link user |
| ------------------------------------------ | ------------------------- | --------- |
| `availableViews` / `defaultView`           | Ignored — all views shown | Enforced  |
| Gallery appearance (size, spacing, radius) | Applied                   | Applied   |
| Typography (font size, alignment)          | Applied                   | Applied   |
| Footer / social links                      | Applied                   | Applied   |
| Banner image                               | Applied                   | Applied   |

### `isBannerImage` / `isHeroImage` Flags

These booleans are computed in `shared/files/sortFiles.ts` (`withHeroImageFlag`) by comparing each file's `id` against `folder.heroImage?.id` and `folder.bannerImage?.id`. They flow through `ViewFolderFileWithHero` → `ReviewableFile` → `SetHeroImageButton` to drive the disabled state of each menu item.

### JSON Scalar (socialLinks)

`socialLinks` is stored as a `JSON` column and the GraphQL scalar type is `unknown` in generated types. Cast it explicitly when reading: `(branding.socialLinks as SocialLink[] | null) ?? []`.

## Troubleshooting

### URQL query not updating

1. Check if mutation invalidates the right queries in `urqlCacheExchange.ts`
2. Try `invalidateQueries(cache, ['queryName'])` manually
3. Check `pause` condition isn't blocking the query

### Styles not applying

1. CSS modules: Import as `import styles from './Component.module.css'`
2. Use `className={styles.myClass}` not `className="myClass"`
3. Check Mantine component supports the style prop you're using

### Component not re-rendering

1. Check Jotai atom is being used correctly (`useAtomValue` vs `useAtom`)
2. Check URQL query dependencies
3. React Compiler may be over-memoizing - check component inputs

### Vite dev server issues

```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run start:client
```

### GraphQL types out of date

```bash
# Regenerate from running backend
npm run start:server  # In one terminal
npm run gql           # In another
```

## Development Workflow

1. Start dev server: `npm run start:client` (or `npm start` for full stack)
2. Vite proxies `/graphql` to backend at `localhost:6900`
3. Hot reload enabled for instant feedback
4. Build for production: `npm run build`
5. Output goes to `dist/public` for backend to serve

## Validation Commands

Run these after frontend changes:

```bash
cd frontend && npm run lint
cd frontend && npx tsc --noEmit
cd frontend && npm run build
```

Also run repo-wide formatting checks:

```bash
npm run format:check
```

For test validation, ask the user to run:

```bash
npm run workflow
```
