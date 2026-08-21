# Frontend Development Guide

React 19 SPA for the PICR admin interface and public gallery views.

Prefer logical CSS properties in new UI (`margin-inline`, `padding-block`,
`inset-inline-start`, and so on) so future RTL support does not require new
physical left/right assumptions.

For internationalized formatting, keep the catalog language and regional
formatting locale distinct. Use `useLanguage().formattingLocale` for numbers and
absolute dates. `Intl.RelativeTimeFormat` produces translated prose, so use
`useLanguage().catalogLanguage` for relative time to keep its words in the same
language as the surrounding catalog text.

When adding translation or formatting hooks to an existing render helper,
render it as a React component (`<Helper ... />`) instead of calling it as a
plain function. A conditionally called helper makes its hooks conditional hooks
of the parent component and causes React's "Rendered fewer hooks than expected"
runtime error. `MetadataTableRows` is one example that must retain its component
boundary. The frontend enables `react-hooks/capitalized-calls` to enforce this
component boundary. Alias a genuinely non-component capitalized library
function to a descriptive lowercase name at import time instead of disabling
the rule; `UAParser as parseUserAgent` is the current example.

`i18next-cli` infers a namespace from `useTranslation('gallery')` inside a
component, but it cannot infer the namespace of a `TFunction` passed into a
helper. Include `{ ns: 'gallery' }` on every `t()` call in those helpers or the
catalog check will incorrectly look for the keys in `common`. The extractor also
treats a numeric `count` interpolation as pluralization; use `count` only when the
key intentionally has plural forms, and choose another interpolation name for
plain numeric display.

Translation keys selected dynamically at runtime are not necessarily visible to
`i18next-cli`, even when TypeScript constrains them to a finite union. Register
each such path in `i18next.config.ts` and in the dynamic catalog contract. Use a
namespace-qualified wildcard `preservePatterns` entry only when the entire
subtree is dynamically selected, such as metadata and global error reasons. In a
mixed subtree such as sort or review, enumerate only the dynamic leaves so
unused-key analysis still checks their static siblings. Preservation makes
unused-key analysis safe, but `i18next-cli status` still excludes wildcarded keys
from its missing-translation count; `npm run i18n:check` therefore runs the
catalog contract as a separate gate. Verify changes to this setup by temporarily
removing a secondary-locale entry and confirming that command fails. Domain
registries that also provide untranslated fallbacks need an additional focused
assertion; metadata descriptions, font presentation, global auth-error reasons
and social-link default titles are current examples.

`SOCIAL_LINK_TYPES[].defaultTitle` is the stable English fallback copied into a
persisted, user-editable social-link `title`; it is not selector presentation
text. Render selector labels from typed catalog keys—even when an official brand
name intentionally has the same spelling in every catalog. Changing UI language
must never rewrite branding or user content, and the catalog contract must keep
English selector labels aligned with these persisted defaults.

The database name of PICR's synthetic root folder stays `Home`. For visible web
labels, use `useFolderNameFormatter()` and treat a folder as that root only when
`parentId === null`. Never infer it from ID `1`, `parents.length === 0`, or the
signed-in user's home-folder scope. Keep raw folder names for editing, paths,
search, filenames, slugs, persisted defaults, and logs. A user-created child
folder named `Home` must remain `Home` in every catalog.

Before adding a catalog whose script is not covered by the default heading
font, establish a deterministic capable fallback and verify both translated UI
headings and user content in that script. For Greek, the agreed initial stack is
the selected branding font, then Roboto, then the system fallback; do not filter
branding choices by the active UI language. Add picker warnings or script-aware
controls only if real usage demonstrates a need.

The frontend literal-string gate is deliberately focused. `i18next/no-literal-string`
checks literals lexically inside JSX plus its configured user-facing attributes,
then applies enclosing component, call, object-property, typed and content
exclusions. It does not police module-level data, helper bodies or handlers
defined outside the returned JSX. A separate `no-restricted-syntax` selector
catches direct literal `title`/`message` properties in inline
`notifications.show({...})` calls, but variables, templates and conditional
expressions still require review.

Keep ESLint `parserOptions.projectService: true`: PICR's type-aware rules depend
on it, and the i18n rule uses contextual literal unions to distinguish stable
typed values from prose. Keep the explicit `labelKey` object-property exclusion
as well; the plugin still reports PICR's current typed `labelKey` literals. Use
only narrow, explained file-level exceptions. `DevBackendOverrideBanner.tsx` is
the current exception because it renders only in the development backend-proxy
workflow; do not replace it with a broad directory or protocol/URL exemption.

LocatorJS is development-only. Its runtime entry (`src/locatorDev.ts`) is injected
by the serve-only `locatorJsDevRuntime` Vite plugin, and its Babel transform in
`vite.config.ts` is likewise restricted to serve mode. Do not import the runtime
from the production `src/index.tsx` entry: in this transform pipeline an
`import.meta.env.DEV` guard was compiled as enabled and shipped the LocatorJS UI
in the built application.

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
| Vidstack     | 1.15.6  | Video player wrapper    |

Vidstack is pinned to `@vidstack/react@1.15.6` intentionally. The package's
plain npm `latest` tag still points at the old 0.x line with React 18 peer
dependencies; do not install bare `@vidstack/react` unless the dist-tags have
been rechecked and the React 19-compatible line is actually `latest`.
Keep Vidstack behind `LazyPicrVideoPlayer`; feed and lightbox surfaces should
not import `PicrVideoPlayer` directly, or the large player bundle gets pulled
into normal folder-view loading.
Do not unconditionally autoplay lightbox videos. Browsers reject unmuted
autoplay without a fresh user gesture, and React Router history state can survive
a reload, so the lightbox only autoplays when either
`wasOpenedFromFolderInCurrentDocument` is true (opened by a folder click) or the
session has been "blessed" (`videoAutoplayBlessedAtom`). The atom flips true the
first time any lightbox video plays — after that the browser has sticky
activation, so each slide the user navigates to may autoplay. A deep-linked or
reloaded session stays silent until the user plays one video manually. Blessing
is lightbox-only (the inline feed never opts in, so it never cascade-autoplays).
YARL keeps neighboring slides mounted within its preload window. Custom video
slides must pass `active={offset === 0}` to `LazyPicrVideoPlayer` so inactive
Vidstack players pause when the user navigates away and the active one (re)starts
via the media remote when autoplay is warranted.
Custom YARL toolbar/footer controls should derive the active file from
`useLightboxState().currentIndex` at render/click time. Do not close over the
parent route's `selectedImage` for lightbox actions: slide navigation updates
the lightbox state first, and a stale closure can act on the file that opened the
lightbox instead of the currently visible slide.

The lightbox chrome is immersive (issue #47): the image is full-bleed
(`imageFit: 'cover'`) and controls float over it. Legibility comes from gradient
**scrims** plus **auto-hide** (`useLightboxChromeAutoHide` toggles
`picr-lightbox-idle` on the lightbox root; chrome fades out when idle and returns
on any pointer/keyboard activity), not from reserving bars. Stacking gotcha when
adding scrims/overlays: the YARL carousel has a CSS `transform` for swipe, so it
is its own stacking context. The title (Captions plugin) and rating footer
(`render.slideFooter`) render **inside** that carousel, while the
toolbar/navigation/counter render at the **container** level above it. A
container-level scrim therefore covers the in-slide title/footer no matter its
`z-index`. Render per-slide scrims via `render.slideHeader`/`render.slideFooter`
(they sit above the slide image, below the in-slide title/footer, and the
container-level chrome naturally paints on top). See `SelectedFileView.tsx` and
`SelectedFileView.css`.
Mobile lightbox chrome deliberately keeps the top bar sparse: slideshow is not
loaded on mobile, and the Zoom plugin toolbar button is hidden with
`render.buttonZoom` while the Zoom plugin stays enabled so pinch-to-zoom keeps
working.
YARL's custom `render.buttonClose` result is substituted directly into the
toolbar's mapped children. Keep an explicit `key="close"` on that replacement or
React emits a missing-key console error whenever the lightbox opens.
Lightbox letter shortcuts must normalize `KeyboardEvent.key` to lowercase before
matching. Chrome on macOS reports Caps Lock letter shortcuts as uppercase keys,
so checking only lowercase `p`/`f`/`x`/`c` skips the shortcut before the
auto-advance path can run.

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

### Folder Links Must Be Real Links

Anything a user clicks to navigate to a folder must render an actual `<a>`, so
"open in new tab", middle-click and "copy link address" work. Use
`useFolderLink` (returns `{ to, component: NavLink }`), `PicrLink`, or
`PicrMenuItem` — never a bare `onClick` + `navigate()`, and never `role="link"`
with a keydown handler, which imitates a link without any of the browser
behaviour.

- Do not call `e.preventDefault()` unconditionally in a link's `onClick` — it
  blocks modifier-click and middle-click. That bug is why `FolderName` looked
  like a link but couldn't be opened in a new tab.
- Do not nest `<a>` inside a button/menu/anchor. Where a card has its own action
  button (see `FolderCard` in `Dashboard.tsx`), the anchor wraps the cover+title
  only and the action sits beside it as a sibling.
- `useSetFolder` still exists for genuinely imperative navigation — redirects,
  drawer `onClose` — not for things people click.

**Patterns for the list/grid surfaces.** Folder rows in the list/table/grid
views are now real links, but the mechanism differs because each surface owns its
own click:

- **Feed** (`ImageFeed`) and buttons/chips (`ViewFolderButton`,
  `BrandingFolderChips`): straight `useFolderLink` — spread it, or pass `to`. A
  Mantine component becomes a link via `<Button {...useFolderLink(folder)}>`.
- **Grid** (`GridGallery` + `@picr/react-grid-gallery`): the tile is a real
  `<a href>`. The package contains PICR's linked-tile support, so its tile
  viewport renders an anchor when the gallery item carries an `href`. File tiles
  carry none and stay a `<div>` (their click opens the lightbox). Import the
  gallery and its types from the package root only; do not deep-import its
  source or recreate the former vendored-source alias.
  PICR owns `@picr/react-grid-gallery`, so its `/frontend` Dependabot entry
  permanently excludes that package from version-update cooldowns. Preserve the
  exact package-name entry under `cooldown.exclude` so releases can be adopted
  immediately without weakening the cooldown for unrelated dependencies.
- **Tables** (`FileListView`, `FileDataListView`): the row keeps its `onClick`
  for convenience, and the folder **name** cell is a real link. To stop the two
  fighting, the row handler bails on `event.defaultPrevented` — `NavLink` calls
  `preventDefault` on a plain click, so the row won't also navigate — and ignores
  modified/middle clicks so the browser can open a new tab. This is the pattern
  to copy for any "clickable row that contains a link".

**Still `onClick`-only:** `QuickFind` results. Deliberately deferred — the
handler fuses mouse click, keyboard (arrow/Enter) selection, drawer close, and
the lightbox history rules below, so converting it is not a spread. Do it as its
own change if you pick it up.

### Folder Fragments: Two Tiers

There are exactly two answers to "how much folder data do I select?", and
hand-rolling a third is what caused the bugs below.

- **Any folder rendered _as a folder_** — card, row, link, breadcrumb, chip,
  search hit, access log row — selects **`MinimumFolderFragment`**. It carries
  everything needed to render the folder _and_ its loading placeholder.
- **The folder you are viewing** selects `FolderFragment`, which is Minimum plus
  `branding`, `permissions` and `brandingId`, via `viewFolderQuery` (which also
  adds `files`/`subFolders`).
- **Exempt:** aggregate selections that render no folder identity and aren't
  navigation sources — `TreeSizeFragment` (recurses the whole library for a size
  chart), and `dashboardGalleriesQuery.folder` (a container, not a link).

`HeroImageFragment` and `FolderBannerFragment` are composition atoms _inside_
Minimum, not a third tier. **`bannerImage` and `bannerSize`/`bannerTextHAlign`/
`bannerTextVAlign` must never be separable**: `bannerSize: null` legitimately
means "classic" _and_ is what graphcache returns for a partial hit, so a reader
cannot tell "default size" from "not cached" and would render the banner at a
guessed height. `HeroImageFragment` used to hand out `bannerImage` without them.

Do not put `branding` in Minimum. It drags a 17-field `BrandingFragment` (incl.
a `socialLinks` JSON blob) onto every folder in every list.

### Loading Folder Names (placeholder)

While a folder view loads, `PlaceholderFolderHeader` shows cached destination
folder identity from a **graphcache lookup keyed off the URL's `folderId`**
(`hooks/useFolderPlaceholder.ts`), so it either shows the right folder or a
generic "Loading" — never a different folder's. It uses two cache reads:
`folderPlaceholderIdentityQuery` for the heading (`id`/`name`/`title`/`subtitle`/
`parentId`), and `folderPlaceholderQuery` for the full renderable placeholder
(breadcrumbs and banner) when the full `MinimumFolderFragment` is cached.

**No navigation surface pushes placeholder data in.** The folder is already in
the cache from whichever query rendered the link, so links need a `to` and
nothing else. This replaced a `placeholderFolder` atom that held the last
_clicked_ folder: it had no key, so it went stale on back/forward and showed the
wrong name. Do not reintroduce that pattern.

`folderPlaceholderQuery` selects `MinimumFolderFragment` — the same document the
normal link sources write — so "did the source cache enough for the full
placeholder?" has one answer rather than a per-field matrix. The lighter
`folderPlaceholderIdentityQuery` exists because breadcrumbs are backed by parent
entities that may only have identity fields cached; those should still show the
real destination title/name while loading, but must not pretend a banner or full
breadcrumb trail is renderable.

`PlaceholderFolderHeader`'s banner branches must mirror `ViewFolder`'s, including
the `activity` mode (both use `helpers/viewFolderMode.ts`) — a placeholder that
disagrees renders a layout the real page then tears down. Render
`FolderBannerView`, never `FolderBanner`: the latter mounts
`useMutation(editFolderMutation)` and admin buttons inside a subtree that
unmounts in ~200ms.

Four things this depends on, all of which break it **silently** — you get a
generic "Loading" or no placeholder at all, never an error:

- **The `key` must be on the `<Suspense>` boundary in `ViewFolder.tsx`, not on
  `ViewFolderBody`.** React Router wraps navigation in `React.startTransition`
  by default, and during a transition React deliberately keeps already-revealed
  content on screen instead of showing a fallback. A keyed _child_ doesn't help:
  the boundary survives, sees it already has content revealed, and holds the
  previous folder on screen until the new one has fully loaded — network
  requests and all. Keying the _boundary_ makes it new, so there is nothing
  revealed to preserve and the fallback renders immediately. Symptom if you get
  this wrong: clicking a folder appears to do nothing for a beat, then jumps
  straight to the loaded folder, skipping the placeholder entirely.
- The `Query.folder` resolver in `urql/urqlCacheExchange.ts`. Graphcache caches
  root fields as links keyed by field name **+ arguments**, so a folder
  normalized from someone's `subFolders` is in the cache as an entity while
  `folder(id: X)` still misses. The resolver bridges the two. Without it the
  placeholder silently falls back to "Loading" — which looks exactly like the
  bug it fixes.
- `requestPolicy: 'cache-only'` + `context: { suspense: false }`. The hook runs
  inside a `<Suspense>` fallback; a fallback that suspends throws, and the
  client sets `suspense: true` globally.
- A folder link's source selecting less than `FolderPlaceholderIdentityFragment`
  breaks the heading fallback; selecting less than `MinimumFolderFragment`
  breaks the full breadcrumb/banner placeholder (see the two-tier rule above).

None of these are visible to lint or `tsc`, and the Playwright smoke tests don't
cover the loading state. **Check this in a browser**, with the network throttled
so the fallback is visible — click a subfolder and confirm its name (and banner,
at the right height) appear while the contents load.

**Known residual:** `themeModeAtom` holds the _previous_ folder's branding during
the fallback, since `ViewFolderBody` only calls `setThemeMode` once the real
query lands. So `headingFontSize`/alignment can still shift on the banner title
between differently-branded galleries. The fix would be putting `branding` in
Minimum — don't; see the payload note above. Banner _layout_ no longer shifts,
which is the part that mattered.

### Lightbox History (back button)

Opening a file **from the folder you are already viewing** is a history **push**;
closing it must **pop** that entry, not push the folder URL again. Route those
opens through `hooks/useSelectedFileId.ts` rather than calling `useSetFolder`
directly — it stamps `{ openedFromFolder: true }` onto the pushed entry and reads
it back on close to choose between `navigate(-1)` and a `replace` to the folder.

The marker means "the entry behind me is this folder's listing". Only stamp it
when that is actually true — an unmarked push is the correct choice for a file in
some _other_ folder, and the two callers below rely on that distinction.

- Pushing on close is what caused issue #68: history became
  `folder → file → folder`, so back reopened the just-closed image, and each
  open/close cycle added another pair of entries to escape from.
- The `replace` fallback is required, not defensive, and carries real behaviour:
  a file URL opened directly (shared deep link, reload) has no folder entry
  behind it, and `navigate(-1)` there would eject the viewer off the site.
- **QuickFind is a deliberate split** (`QuickFind.tsx`). A hit in the folder
  currently being viewed goes through the hook. A cross-folder hit does not: the
  unmarked push plus replace-on-close leaves the viewer in the folder the file
  lives in, with back returning to where they searched from. Do not "fix" this
  into an unconditional hook call.
- Callers that open a file must be checked against this rule, not assumed —
  `FileMenu.tsx` ("View {file}") and the feed's "Open in Slideshow" button both
  open the lightbox down paths separate from the grid/list click handler.
- Navigation **between** slides (the YARL `view` event) replaces rather than
  pushes, and must forward `state: location.state`. Dropping the marker there
  strands the entry and makes back appear to do nothing.
- Subfolder navigation stays a plain `useSetFolder` push — only file open/close
  is special.
- Hash-backed atoms (`atomWithHash` with `setHash: 'replaceState'`) preserve
  `history.state`, so modal/sort/view hash changes do not clear the marker.

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
    editUser: (_, args, cache) =>
      invalidateQueries(cache, ['folder', 'users']),
    editAdminUser: (_, args, cache) => invalidateQueries(cache, ['admins']),
    deleteUser: (_, args, cache) =>
      invalidateQueries(cache, ['admins', 'users']),
    addComment: (_, args, cache) => invalidateQueries(cache, ['comments']),
    // ...
  },
},
```

Consider invalidating the appropriate "list" query when adding or removing an
item. Updates to an existing item should be handled automatically without doing
this. Public links are users: `editUser` must invalidate `users` as well as
`folder`, because `ManagePublicLinks` and dashboard client activity read
`Query.users` lists and graphcache will not add a newly-created `User` entity to
those lists automatically. Admin users have the same list-cache concern:
`editAdminUser` must invalidate `admins`, and `deleteUser` must invalidate both
`admins` and `users` because it soft-deletes either user type.

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
  fontFamily: bodyFontFamily,
  headings: {
    fontFamily: `var(--picr-heading-font, ${defaultHeadingFontFamily})`,
  },
  primaryColor: 'blue', // Overridden per-folder via branding
});
```

`--picr-heading-font` contains the complete selected branding font → Roboto →
system stack, not only the selected family. Use `headingFontFamily()` for
branding previews and any other surface that cannot consume the variable
directly. This keeps Greek and other unsupported glyphs deterministic without
filtering branding choices by interface language.

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
  normal anchor download. It swallows the share-sheet `AbortError`.
- **Progress UI: one surface, shown late.** Nothing is displayed for the first
  `SHARE_PROMPT_UI_DELAY_MS` (1s) after the tap — a download that beats the timer goes
  straight to the share sheet with no UI at all, which is the common case for images.
  If it's still running, a modal appears with a progress bar driven by streaming the
  response body against its `Content-Length` (an indeterminate spinner when the length
  is unknown, which is also what covers the pre-first-byte wait). There is deliberately
  no progress toast — do not reintroduce one, and note the timer is armed at tap time,
  **not** after the `fetch` resolves, so a slow server response is still covered.
- If the fetch outlives Safari's user activation, the modal waits for a fresh
  "Save to Photos" tap before calling `navigator.share()`. Keep that call inside the
  fresh button handler; moving it back after the async fetch reintroduces
  `NotAllowedError` failures on larger videos.
- **Cancellation:** the fetch runs under an `AbortController`, exposed as `cancel` on
  `SharePromptState` (set only while `status === 'downloading'`; once the file is in
  hand the modal's X is a plain dismiss). The X and Escape abort; click-outside stays
  disabled while busy so a stray tap can't kill a long video download. An aborted fetch
  rejects the in-flight `reader.read()` and lands in the outer catch's `AbortError`
  branch, which must stay silent — no error toast, no `anchorDownload` fallback.
- The helper intentionally allows only one active iOS share download at a time so
  simultaneous downloads cannot overwrite the pending modal state. **Every terminal path
  must either call `clearActiveShareDownload` or leave the id for the modal's `close()`
  to clear.** Leak it and the single-flight guard wedges every later download behind the
  "Download already running" toast until a page reload. The id-guard inside
  `clearActiveShareDownload` is what makes cancel-then-immediately-retap safe — a stale
  download's unwind cannot clear a newer download's id.
- **Transient activation is the whole reason that helper is shaped the way it is.**
  `navigator.share({ files })` needs transient activation, which expires "at most a few
  seconds" after a tap (Chrome documents ~1s; WebKit deliberately does not expose
  Safari's timer). A slow fetch followed by `share()` is WebKit's own worked example of
  the problem, and they state there is no platform fix:
  <https://webkit.org/blog/13862/the-user-activation-api/>. A fresh tap is the only
  workaround. Consequently:
  - `SHARE_PROMPT_UI_DELAY_MS` (1s) is **presentation only** — when the modal appears.
    It is not an activation guess. Do not "fix" it to match some timer value. It is 1s
    rather than longer because once the modal is up we ask for a fresh tap
    unconditionally, and a download still running at 1s has most likely outlived
    activation and needed that tap anyway.
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

`PublicLinkPasscodeGate` may apply its deliberately limited branding preview
only while it is rendering the passcode or unavailable screen. Once the gate
opens, `ViewFolder` is the sole owner of the complete gallery theme. Do not keep
the gate effect active over the gallery or make its preview mirror every visual
branding field: the parent gate effect runs after the child folder effect and
would overwrite complete folder branding with preview defaults.

When adding a visual branding field, also add it to the hand-built `brandingKey`
in `ViewFolder.tsx`. That key controls when `applyBrandingDefaults` is recomputed;
omitting a field can leave stale branding when a poll or navigation changes only
that value.

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

## Lightbox (yet-another-react-lightbox)

The lightbox lives in `src/components/FileListView/SelectedFile/`. Chrome sits in
reserved top/bottom rails (`lightboxRailsPlugin.tsx`) so nothing is ever drawn
over the photograph — see issues #47 and #79 for why.

### `.yarl__container` has an implicit layout contract — read this before adding elements

`.yarl__container` carries YARL's `yarl__flex_center` class
(`display: flex; align-items: center; justify-content: center`). Two consequences
that are invisible from the JSX and have each caused a bug already:

1. **The centring _is_ the slide positioning.** YARL renders a window of slides
   either side of the current one, makes `.yarl__carousel` deliberately several
   viewports wide, and relies on the parent centring it to bring the middle —
   i.e. current — slide into view. There is no transform in the steady state. Any
   element inserted between the container and the carousel must reproduce
   `display: flex; align-items: center; justify-content: center`, or the carousel
   sits at `left: 0` and you see the slide `carousel.preload` places _before_ the
   current one, while the counter still reads correctly.

2. **Children of the container are flex items, not blocks.** They size to their
   content on the main axis and `min-width: auto` stops them shrinking back — and
   their content is that oversized carousel. Any such child needs
   `flex: 1; min-width: 0` or it inherits the carousel's width and gets centred
   off-screen, with its own contents thrown past both edges of the viewport while
   still measuring a correct height and vertical position.

Case 2 is masked by images (`max-width: 100%` lets their min-content width
collapse) and exposed by video, which is rendered with an explicit pixel width.
Because `carousel.preload` mounts neighbouring slides, **one video anywhere in
the folder reproduces it on every slide**. If lightbox chrome is missing or
mispositioned, measure it first — `getBoundingClientRect()` on the rail will show
a negative `x` and a width several times the viewport.

### Other YARL gotchas

- `on.click` never fires for image slides. The Zoom plugin augments
  `render.slide`, and YARL only wires `on.click` in the fallback branch that runs
  when `render.slide` returns nothing. Tap detection is ours — see
  `hooks/useTapGesture.ts`.
- Plugin buttons are replaced through each plugin's `render.button*` slot, which
  is supported API. Changing the `plugins` array identity rebuilds YARL's whole
  module tree and remounts every slide, so it must stay constant.
- `slideRect` is derived from the Controller's element, which still spans the
  full height even though the rails shrink the carousel inside it. Images are laid
  out by CSS and unaffected; anything sizing itself from `rect` must subtract
  `RAIL_HEIGHT` (see `SelectedFileView`).
- The video player's buttons are customisable through Vidstack's `slots` prop on
  `DefaultVideoLayout` (`PicrVideoPlayer.tsx`) — used to drop the download button
  on proof links and to add the exit-Focus control.

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
