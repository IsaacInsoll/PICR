import { GraphQLBoolean, GraphQLNonNull, GraphQLObjectType } from 'graphql';

export const clientInfoType = new GraphQLObjectType({
  name: 'ClientInfo',
  fields: () => ({
    avifEnabled: { type: new GraphQLNonNull(GraphQLBoolean) },
  }),
});
