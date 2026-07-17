import { cacheExchange } from '@urql/exchange-graphcache';
import schema from '@shared/urql/graphql.schema.json';
import { invalidateQueries } from '../helpers/invalidateQueries';

export const urqlCacheExchange = cacheExchange({
  schema,
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
      editUser: (_, args, cache) => invalidateQueries(cache, ['folder']),
      deleteUser: (_, args, cache) => invalidateQueries(cache, ['users']),
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
});
