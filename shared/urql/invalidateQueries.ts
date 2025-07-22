import { Cache } from '@urql/exchange-graphcache';
import {Query} from '@/gql/graphql';

export const invalidateQueries = (
  cache: Cache,
  queryNames: (keyof Query)[],
) => {
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
  // @ts-ignore
    .filter((field) => queryNames.includes(field.fieldName ))
    .forEach((field) => {
      console.log(' - Invalidated ' + field.fieldName);
      cache.invalidate('Query', field.fieldName, field.arguments);
    });
};
