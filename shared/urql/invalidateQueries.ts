import type { Cache } from '@urql/exchange-graphcache';
import type { Query } from '@shared/gql/graphql';

export const invalidateQueries = (
  cache: Cache,
  queryNames: (keyof Query)[],
) => {
  const queryNameSet = new Set<string>(queryNames as string[]);
  // console.log('Invalidating Queries: ' + queryNames.toString());
  // console.log(
  //   'cache includes: ' +
  //     cache
  //       .inspectFields('Query')
  //       .map((field) => field.fieldName)
  //       .join(','),
  // );
  cache
    .inspectFields('Query')
    .filter((field) => queryNameSet.has(field.fieldName))
    .forEach((field) => {
      // console.log(' - Invalidated ' + field.fieldName);
      cache.invalidate('Query', field.fieldName, field.arguments);
    });
};

export const invalidateQueryObjects = (cache: Cache, queryNames: string[]) => {
  const queryNameSet = new Set<string>(queryNames);
  cache
    .inspectFields('Query')
    .filter((field) => queryNameSet.has(field.fieldName))
    .forEach((field) => {
      const resolved = cache.resolve('Query', field.fieldName, field.arguments);
      if (Array.isArray(resolved)) {
        resolved.forEach((key) => {
          if (typeof key === 'string') cache.invalidate(key);
        });
      }
    });
};
