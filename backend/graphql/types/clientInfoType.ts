import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { GraphQLBigInt } from 'graphql-scalars';

export const clientInfoType = new GraphQLObjectType({
  name: 'ClientInfo',
  fields: () => ({
    avifEnabled: { type: new GraphQLNonNull(GraphQLBoolean) },
  }),
});
