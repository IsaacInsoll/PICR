import { Client, fetchExchange } from 'urql';
import { retryExchange } from '@urql/exchange-retry';
import { cacheExchange } from '@urql/exchange-graphcache';
import schema from './graphql.schema.json';

const retry = retryExchange({ initialDelayMs: 500 });

//TODO: merge this with frontend (web) client, i was just having issues importing the client from frontend

const cx = cacheExchange({
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
    },
  },
});

export const urqlClient = (url: string, headers: HeadersInit) => {
  return new Client({
    url: url + 'graphql',
    suspense: true,
    exchanges: [cx, retry, fetchExchange],
    fetchOptions: () => {
      return { headers };
    },
  });
};

const invalidateQueries = (cache, queryName: string) => {
  console.log(`[cache] invalidate '${queryName}'`);
  cache
    .inspectFields('Query')
    .filter((field) => field.fieldName === queryName)
    .forEach((field) => {
      console.log(
        '[cache]: successfully invalidating cache for: ' + field.fieldName,
      );
      cache.invalidate('Query', field.fieldName, field.arguments);
    });
};
