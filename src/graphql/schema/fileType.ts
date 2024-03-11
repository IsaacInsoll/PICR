import {
  GraphQLFloat,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { metadataSummaryType } from './metadataSummaryType';

export const fileType = new GraphQLObjectType({
  name: 'File',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    folderId: { type: new GraphQLNonNull(GraphQLID) },
    imageRatio: { type: GraphQLFloat },
    fileHash: { type: new GraphQLNonNull(GraphQLString) },
    metadata: { type: metadataSummaryType },
  }),
});
