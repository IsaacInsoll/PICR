import { Cache } from '@urql/exchange-graphcache';
import type { Query } from '@shared/gql/graphql';

export const invalidateQueries = (
  cache: Cache,
  queryNames: (keyof Query)[],
) => {
  cache
    .inspectFields('Query')
    .filter((field) => queryNames.includes(field.fieldName as keyof Query))
    .forEach((field) => {
      cache.invalidate('Query', field.fieldName, field.arguments);
    });
};

export function invalidateQueryObjects(cache: Cache, queryNames: string[]) {
  cache
    .inspectFields('Query')
    .filter((field) => queryNames.includes(field.fieldName))
    .forEach((field) => {
      const resolved = cache.resolve('Query', field.fieldName, field.arguments);
      if (Array.isArray(resolved)) {
        resolved.forEach((key) => {
          if (typeof key === 'string') cache.invalidate(key);
        });
      }
    });
}
