import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

export const clientInfoType = new GraphQLObjectType({
  name: 'ClientInfo',
  fields: () => ({
    avifEnabled: { type: new GraphQLNonNull(GraphQLBoolean) },
    canWrite: { type: new GraphQLNonNull(GraphQLBoolean) },
    baseUrl: { type: new GraphQLNonNull(GraphQLString) },
  }),
});
