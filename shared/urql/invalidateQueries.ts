import { Cache } from '@urql/exchange-graphcache';
import { Query } from '@/gql/graphql';

export const invalidateQueries = (
  cache: Cache,
  queryNames: (keyof Query)[],
) => {
  const queryNameSet = new Set<string>(queryNames as string[]);
  console.log('Invalidating Queries: ' + queryNames.toString());
  console.log(
    'cache includes: ' +
      cache
        .inspectFields('Query')
        .map((field) => field.fieldName)
        .join(','),
  );
  cache
    .inspectFields('Query')
    .filter((field) => queryNameSet.has(field.fieldName))
    .forEach((field) => {
      console.log(' - Invalidated ' + field.fieldName);
      cache.invalidate('Query', field.fieldName, field.arguments);
    });
};
