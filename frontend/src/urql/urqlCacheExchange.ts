import { cacheExchange } from '@urql/exchange-graphcache';
import schema from '@shared/urql/graphql.schema.json';
import { invalidateQueries } from '../helpers/invalidateQueries';

export const urqlCacheExchange = cacheExchange({
  schema,
  keys: {
    ImageMetadataSummary: () => null,
    VideoMetadataSummary: () => null,
    Task: () => null,
  },
  updates: {
    Mutation: {
      // REMINDER: name of individual operation, not the whole mutation you are posting
      editUser: (_, args, cache) => invalidateQueries(cache, ['folder']),
      addComment: (_, args, cache) => invalidateQueries(cache, ['comments']),
      deleteBranding: (_, args, cache) =>
        invalidateQueries(cache, ['brandings', 'folder']),
      editBranding: (_, args, cache) =>
        invalidateQueries(cache, ['brandings', 'folder']),
      renameFolder: (_, args, cache) =>
        invalidateQueries(cache, ['allFolders', 'folder', 'searchFolders']),
    },
  },
});
