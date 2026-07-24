import { cacheExchange } from '@urql/exchange-graphcache';
import schema from './graphql.schema.json'; // with { type: 'json' }
import { invalidateQueries } from './invalidateQueries';

export const urqlCacheExchange = cacheExchange({
  schema,
  keys: {
    ClientInfo: () => null,
    ServerSettings: () => null,
    ThumbnailDimensions: () => null,
    BenchmarkResult: () => null,
    BenchmarkStep: () => null,
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
      addComment: (_, args, cache) => invalidateQueries(cache, ['comments']),
      deleteBranding: (_, args, cache) =>
        invalidateQueries(cache, ['brandings', 'folder']),
      editBranding: (_, args, cache) =>
        invalidateQueries(cache, ['brandings', 'folder']),
      editServerSettings: (_, args, cache) =>
        invalidateQueries(cache, ['serverInfo', 'clientInfo']),
    },
  },
});
