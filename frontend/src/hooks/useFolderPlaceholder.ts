import { useQuery } from 'urql';
import { folderPlaceholderQuery } from '@shared/urql/queries/folderPlaceholderQuery';
import { folderPlaceholderIdentityQuery } from '@shared/urql/queries/folderPlaceholderIdentityQuery';

// Looks up a folder we've almost certainly already loaded (as someone's
// `subFolders`, or a user's `folder`) so a loading folder view can show its real
// name and breadcrumbs instead of "Loading".
//
// Keyed off the folderId in the URL, so it either returns the right folder or
// nothing - it can never show a different folder's name. That's why this
// replaced the old `placeholderFolder` atom, which held the last *clicked*
// folder and went stale on back/forward.
//
// Two non-obvious requirements:
//  - `cache-only` keeps this off the network entirely. It's a synchronous read
//    from the in-memory normalized cache, not a request.
//  - `suspense: false` overrides the client's global `suspense: true`. This runs
//    inside a <Suspense> fallback, and a fallback that suspends would throw.
//
// Returns undefined on a cache miss (cold tab, direct URL, hard refresh), which
// correctly falls back to a generic loading state. Requires the `Query.folder`
// resolver in urqlCacheExchange - without it this always misses.
// Hoisted: urql keys its internal memo on the context reference, so an inline
// object would rebuild the query source on every render.
const noSuspense = { suspense: false };

export const useFolderPlaceholderIdentity = (folderId: string | undefined) => {
  const [{ data }] = useQuery({
    query: folderPlaceholderIdentityQuery,
    variables: { folderId: folderId ?? '' },
    pause: !folderId,
    requestPolicy: 'cache-only',
    context: noSuspense,
  });

  return data?.folder ?? undefined;
};

export const useFolderPlaceholder = (folderId: string | undefined) => {
  const [{ data }] = useQuery({
    query: folderPlaceholderQuery,
    variables: { folderId: folderId ?? '' },
    pause: !folderId,
    requestPolicy: 'cache-only',
    context: noSuspense,
  });

  return data?.folder ?? undefined;
};
