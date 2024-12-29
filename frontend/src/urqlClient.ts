import { Client, fetchExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache';
import { getUUID } from './Router';
import schema from './../public/graphql.schema.json';
import { invalidateQueries } from './helpers/invalidateQueries';

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

export const createClient = (authToken: string, sessionKey: string) =>
  new Client({
    url: '/graphql',
    suspense: true,
    exchanges: [cx, fetchExchange],
    fetchOptions: () => {
      const uuid = getUUID();
      return {
        headers: {
          authorization: authToken !== '' && !uuid ? `Bearer ${authToken}` : '',
          uuid: uuid ?? '',
          sessionId: sessionKey,
        },
      };
    },
  });
