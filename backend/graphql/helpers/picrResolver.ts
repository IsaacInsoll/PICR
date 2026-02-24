import type { GraphQLFieldResolver } from 'graphql';
import type { PicrRequestContext } from '../../types/PicrRequestContext.js';

type NormalizeIdInput<T> = T extends string
  ? number
  : T extends (infer U)[]
    ? NormalizeIdInput<U>[]
    : T;

type DbIdArgKey =
  | 'id'
  | 'folderId'
  | 'fileId'
  | 'userId'
  | 'brandingId'
  | 'heroImageId'
  | 'parentId';

type NormalizeResolverArgs<TArgs> = {
  [K in keyof TArgs]: K extends DbIdArgKey
    ? NormalizeIdInput<TArgs[K]>
    : TArgs[K];
};

export type PicrResolver<TSource = object, TArgs = never> = [TArgs] extends [
  never,
]
  ? GraphQLFieldResolver<TSource, PicrRequestContext>
  : GraphQLFieldResolver<
      TSource,
      PicrRequestContext,
      NormalizeResolverArgs<TArgs>
    >;
