import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { GraphQLBigInt } from 'graphql-scalars';

export const serverInfoType = new GraphQLObjectType({
  name: 'ServerInfo',
  fields: () => ({
    version: { type: new GraphQLNonNull(GraphQLString) },
    host: { type: new GraphQLNonNull(GraphQLString) },
    databaseUrl: { type: new GraphQLNonNull(GraphQLString) },
    usePolling: { type: new GraphQLNonNull(GraphQLBoolean) },
    dev: { type: new GraphQLNonNull(GraphQLBoolean) },
    cacheSize: { type: new GraphQLNonNull(GraphQLBigInt) },
    mediaSize: { type: new GraphQLNonNull(GraphQLBigInt) },
  }),
});
