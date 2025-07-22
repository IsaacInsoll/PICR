import { Cache } from '@urql/exchange-graphcache';
import type { Query } from '@shared/gql/graphql';

export const invalidateQueries = (
  cache: Cache,
  queryNames: (keyof Query)[],
) => {
  if (import.meta.env.DEV) {
    console.log('Invalidating Queries: ' + queryNames.toString());
    console.log(
      'cache includes: ' +
        cache
          .inspectFields('Query')
          .map((field) => field.fieldName)
          .join(','),
    );
  }
  cache
    .inspectFields('Query')
    .filter((field) => queryNames.includes(field.fieldName))
    .forEach((field) => {
      if (import.meta.env.DEV) console.log(' - Invalidated ' + field.fieldName);
      cache.invalidate('Query', field.fieldName, field.arguments);
    });
};

export function invalidateQueryObjects(cache: Cache, queryNames: string[]) {
  cache
    .inspectFields('Query')
    .filter((field) => queryNames.includes(field.fieldName))
    .forEach((field) =>
      cache
        .resolve('Query', field.fieldName, field.arguments)
        ?.forEach((key) => cache.invalidate(key)),
    );
}
