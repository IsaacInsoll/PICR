import { GraphQLInt, GraphQLNonNull, GraphQLObjectType } from 'graphql';

export const thumbnailCompletionType = new GraphQLObjectType({
  name: 'ThumbnailCompletion',
  fields: () => ({
    totalFiles: { type: new GraphQLNonNull(GraphQLInt) },
    completeFiles: { type: new GraphQLNonNull(GraphQLInt) },
    incompleteFiles: { type: new GraphQLNonNull(GraphQLInt) },
    totalArtifacts: { type: new GraphQLNonNull(GraphQLInt) },
    missingArtifacts: { type: new GraphQLNonNull(GraphQLInt) },
  }),
});
