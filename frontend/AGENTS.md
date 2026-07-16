# Frontend Development Guide

React 19 SPA for the PICR admin interface and public gallery views.

## Tech Stack

| Technology   | Version | Purpose                 |
| ------------ | ------- | ----------------------- |
| React        | 19.2.7  | UI framework            |
| React Router | 8.x     | Routing                 |
| Mantine      | 9.x     | UI component library    |
| Jotai        | 2.17    | Atomic state management |
| URQL         | 5.0     | GraphQL client          |
| Vite         | 8.x     | Build tool              |
| TypeScript   | 6.0     | Type safety             |

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

React Router 8 in declarative mode (`BrowserRouter`, `Routes`, `Route`) with
these main routes:

```typescript
// Public gallery (Link users)
/s/:uuid/:folderId/:fileId?/:tab?

// Admin routes (authenticated)
/admin                          // Dashboard
/admin/f/:folderId/:fileId?/:tab?  // Folder view
/admin/settings/:tab?/:slug?    // Settings pages

// Root redirects to /admin
```

React Router 8 requires Node 22.22+ and React/React DOM 19.2.7+. Keep DOM
router imports in declarative mode from `react-router`; this project does not
use `react-router-dom`.

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

// atoms/fileSortAtom.ts - sort preference (URL hash + localStorage)
export const fileSortAtom = atom<FileSort, [FileSort], void>(/* ... */);
```

#### Sort preference resolution (`atoms/fileSortAtom.ts`)

`fileSortAtom` resolves the active sort with this precedence:

1. URL hash `#s=` (bookmarkable/shareable, wins so links stay stable)
2. `fileSort` in **localStorage** (this browser's remembered choice)
3. The active Branding's `defaultFileSort` (admin-set, mirrored via `themeModeAtom`)
4. App default (Filename ascending)

Writing a sort updates **both** the URL hash and localStorage. Persistence is
deliberately per-browser localStorage, not a backend user column: Link users are
shared public URLs, so a server-side field would leak one viewer's choice to
everyone on the same link.

The value is a compact string from `encodeFileSort`/`decodeFileSort`
(`shared/files/sortFiles.ts`): `<typeChar>` + optional `a` (ascending) + optional
`i` ("interleaved", i.e. folders NOT grouped first). The `i` is only emitted for
the non-default `foldersFirst: false` case, so every pre-existing hash/branding
string stays byte-identical and decodes as `foldersFirst: true`. `decodeFileSort`
reverts unknown/garbage strings to the default rather than guessing.

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

Public-link request headers can change after the frontend URQL client is
created. For example, gallery passcodes are entered after `/s/:uuid/...` loads
and are stored in `sessionStorage`. Keep public-link header values read inside
`fetchOptions` for each request rather than closing over a fixed header object.

Release/update queries may return an empty `latest` string when the backend
cannot reach GitHub and has no stale cache. Do not show that as "update
available"; only show update UI when the normalized latest semantic version is
newer than the running version.

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

Mantine 9.x requires React 19.2+ and all installed `@mantine/*` packages must
stay on the same exact version range. PICR preserves the Mantine 8.x light
variant colors with `v8CssVariablesResolver`, keeps `defaultRadius: 'sm'`, and
sets notifications to `pauseResetOnHover="notification"` to avoid subtle UI
behavior changes from the 9.x defaults.

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

### Data Tables

- `PicrDataGrid` is the local table abstraction. It is backed by
  `@tanstack/react-table` and rendered with Mantine primitives.
- Keep table-library types inside `components/PicrDataGrid/`; callers should
  use the exported `createPicrColumns` helper and `PicrColumns` type rather than
  importing TanStack directly.
- Use `createPicrColumns<T>().accessor(keyOrFn, options)` for direct row keys,
  dotted accessor keys, and derived typed values. Use `.display(options)` for
  action/display-only columns.
- Accessor columns, including function accessors, follow TanStack's default
  sortable behavior. Set `enableSorting: false` only when a value column should
  not be sortable.
- Column sizing is explicit CSS sizing: use `widthPercent` for percentage
  widths, and `width`, `minWidth`, or `maxWidth` for CSS length values or pixel
  numbers.

### Browser API Availability

- PICR can be self-hosted over plain HTTP, and the Vite dev server may be
  accessed from another machine over HTTP rather than `localhost`. Frontend
  startup code must not assume secure-context-only APIs like
  `crypto.randomUUID()` exist. `atoms/authAtom.ts` keeps a fallback for the
  access-log `sessionId` header.

### Media Downloads (iOS share sheet)

- iOS Safari (and iPadOS) does not honor the HTML5 anchor `download` attribute for
  same-origin files — it opens the "Save to Files" picker instead of downloading, so
  photos/videos can't reach the Photos library. Android/desktop honor `download` and
  must not change.
- Route per-file **media** downloads (Image/Video) through
  `helpers/shareOrDownload.ts` (`shareOrDownload`), which on iOS fetches the file and
  opens the native Web Share sheet ("Save to Photos"), and elsewhere falls back to the
  normal anchor download. While fetching (large videos take time) it shows a Mantine
  notification with a real progress bar driven by streaming the response body against
  its `Content-Length` (falls back to an indeterminate spinner if the length is
  unknown), and swallows the share-sheet `AbortError`. If the fetch takes long enough
  for Safari's user activation to expire, the flow switches to a modal and waits for a
  fresh "Save to Photos" tap before calling `navigator.share()`. Keep that call inside
  the fresh button handler; moving it back after the async fetch reintroduces
  `NotAllowedError` failures on larger videos. The helper intentionally allows only one
  active iOS share download at a time so simultaneous downloads cannot overwrite the
  pending modal state.
- **Transient activation is the whole reason that helper is shaped the way it is.**
  `navigator.share({ files })` needs transient activation, which expires "at most a few
  seconds" after a tap (Chrome documents ~1s; WebKit deliberately does not expose
  Safari's timer). A slow fetch followed by `share()` is WebKit's own worked example of
  the problem, and they state there is no platform fix:
  <https://webkit.org/blog/13862/the-user-activation-api/>. A fresh tap is the only
  workaround. Consequently:
  - `SHARE_PROMPT_UI_DELAY_MS` (2.5s) is **presentation only** — when the toast becomes
    a modal. It is not an activation guess. Do not "fix" it to match some timer value.
  - Auto-share (skipping the extra tap on fast downloads) is gated by
    `hasTransientActivation()`, which prefers `navigator.userActivation.isActive`
    (Safari/iOS 16.4+) and falls back to a pessimistic elapsed-time check on older iOS.
  - Correctness does not depend on either heuristic: a `NotAllowedError` from
    auto-share recovers into the same ready modal, so a wrong guess costs one extra tap
    rather than a failed download. Preserve that recovery path.
- Existing entry points wired up: the lightbox Download button
  (`SelectedFile/SelectedFileView.tsx` via the YARL `download` custom function), the
  image-feed per-file button (`ImageFeed.tsx`), and the list-view file menu
  (`FileMenu.tsx`). Gate with `canUseShareSheet()` + `isShareableMediaFile(file)`.
- Do NOT route ZIP or CSV/txt exports through this — "Save to Files" is correct for
  documents.

### Mantine-Idiomatic Styling

- Prefer Mantine primitives/props (`Paper`, `Overlay`, `Container`, spacing, radius, shadow) over ad-hoc wrapper `div` styling.
- Prefer Mantine theme tokens/helpers (`useMantineTheme`, `alpha`, color scales, `primaryColor`) over hardcoded hex/RGBA values.
- Use CSS modules for static layout/styling; keep inline `style` only for runtime-calculated values (for example transforms and computed dimensions).

### Typed CSS Modules

- CSS modules are typed using `typed-css-modules` and generated `*.module.css.d.ts` files are committed to the repo.
- Prefer camelCase CSS class names so `styles.className` dot notation works cleanly.
- Regenerate after editing CSS modules: `npm run css:types`.
- CI/lint guard: `npm run lint` runs `npm run css:types:check` first and fails if type declarations are stale.
- Always run `npm run lint` for all changes before reporting completion, even when TypeScript and formatting already pass.
- Root dev command integration: `npm start` (from repo root) runs `css:types:watch` automatically alongside frontend/backend watchers.
- Generated CSS module declaration files are excluded from Prettier to avoid conflicts with `typed-css-modules` output.

### Render-Sensitive UI

- Avoid GraphQL reads inside frequently rerendered leaf controls like copy/share buttons. In the public-link UI, deriving the link from the current browser origin and `withBasePath(...)` is cheaper than calling `useMe()` just to read `clientInfo.baseUrl`.
- Live branding preview writes to `themeModeAtom`, which is consumed by the app shell and gallery components. Do not publish every draft form keystroke directly to this atom; debounce preview-only fields and keep non-preview fields local so settings inputs stay responsive.
- Do not pass inline function components to render slots in gallery/lightbox-style components. React treats a new function identity as a new component type and can remount thumbnails during background query refreshes, resetting image loaded state and causing visible flashes.

### Folder Hierarchy Data

- `folder.parents` is ordered closest-parent first, with older ancestors later in the array.
- For breadcrumb UIs, truncate that array before reversing it for display so the immediate parent remains visible on deep paths.

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

`thumbnailSpacing` affects more than the gap between gallery tiles on web. The gallery view also derives its outer page breathing room from that same branding field, using a dampened responsive mapping so existing saved spacing values do not explode at the page edge.

Branding `headingAlignment` is intentionally limited to `left` and `center` in the editor and GraphQL schema. Legacy stored `right` values remain possible in older string-backed DB rows, but GraphQL resolvers normalize them to `left` before clients see them. Banner text positioning is a separate folder-level control and still supports left/center/right with its own default, so changing the general heading default must not change banner defaults.

`headingAlignment` only takes effect from the tablet breakpoint up. On mobile the folder header always centers its title, subtitle, and actions because left/right alignment looks awkward at phone widths.

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

### Production Backend Override

For UI-only development against a larger remote dataset, run the Vite frontend
with `VITE_PICR_DEV_BACKEND_URL=https://your-picr.example/ npm run start`.
This dev-only override proxies GraphQL queries, `/image`, and `/zip` requests
to the configured backend while keeping the browser on the Vite origin. GraphQL
mutations other than login are blocked by the dev proxy, and a banner is shown
in the UI.

Only use this when local frontend GraphQL documents match the remote server's
schema. Backend/API changes still require the normal local backend and codegen
workflow.

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
