import {
  cacheExchange,
  type CacheExchangeOpts,
} from '@urql/exchange-graphcache';
import schema from '@shared/urql/graphql.schema.json';
import { fileGlobalIDs } from '@shared/urql/fileCacheIdentity';
import { invalidateQueries } from '../helpers/invalidateQueries';

export const urqlCacheConfig = {
  schema,
  // File, Image and Video are runtime views of the same Files-table row, and
  // that row can change media type after a rename/rescan. Key all three by the
  // shared database ID so a stale concrete typename cannot shadow the current
  // entity.
  globalIDs: [...fileGlobalIDs],
  resolvers: {
    Query: {
      // Links the root `folder(id:)` field to the already-normalized Folder
      // entity. Without this, a folder we only know about via another query's
      // `subFolders` (or a user's `folder`) is in the cache as an entity but
      // `folder(id: X)` still misses, because root fields are cached as links
      // keyed by field name + arguments. This is what lets the loading header
      // show the destination folder's name - see PlaceholderFolderHeader.
      folder: (_parent, args) => ({
        __typename: 'Folder',
        id: String(args['id']),
      }),
      // The file implementations use global IDs above, so the database ID is
      // also the normalized entity key. Return it only when that entity is
      // already cached; otherwise Graphcache must forward the query.
      file: (_parent, args, cache) => {
        const id = String(args['id']);
        return cache.resolve(id, 'id') !== undefined ? id : undefined;
      },
    },
  },
  keys: {
    ClientInfo: () => null,
    FolderFileExport: () => null,
    FolderFilesResult: () => null,
    ImageMetadataSummary: () => null,
    VideoMetadataSummary: () => null,
    Task: () => null,
  },
  updates: {
    Mutation: {
      // REMINDER: name of individual operation, not the whole mutation you are posting
      editUser: (_, args, cache) =>
        invalidateQueries(cache, ['folder', 'users']),
      editAdminUser: (_, args, cache) => invalidateQueries(cache, ['admins']),
      deleteUser: (_, args, cache) =>
        invalidateQueries(cache, ['admins', 'users']),
      addComment: (_, args, cache) => invalidateQueries(cache, ['comments']),
      deleteBranding: (_, args, cache) =>
        invalidateQueries(cache, ['brandings', 'folder']),
      editBranding: (_, args, cache) =>
        invalidateQueries(cache, ['brandings', 'folder']),
      renameFolder: (_, args, cache) =>
        invalidateQueries(cache, ['allFolders', 'folder', 'searchFolders']),
      rescanFolder: (_, args, cache) =>
        invalidateQueries(cache, [
          'allFolders',
          'dashboardStats',
          'folder',
          'folderFiles',
          'searchFiles',
          'searchFolders',
          'tasks',
        ]),
    },
  },
} satisfies CacheExchangeOpts;

export const urqlCacheExchange = cacheExchange(urqlCacheConfig);
