import { GraphQLBoolean, GraphQLNonNull, GraphQLObjectType } from 'graphql';

export const publicLinkInfoType = new GraphQLObjectType({
  name: 'PublicLinkInfo',
  fields: () => ({
    requiresPasscode: { type: new GraphQLNonNull(GraphQLBoolean) },
    unlocked: { type: new GraphQLNonNull(GraphQLBoolean) },
  }),
});
