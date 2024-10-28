import {
  GraphQLFloat,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql/index';
import {
  fileInterface,
  fileInterfaceFields,
} from '../interfaces/fileInterface';
import { imageMetadataSummaryType } from './imageMetadataSummaryType';

export const imageFileType = new GraphQLObjectType({
  name: 'Image',
  interfaces: [fileInterface],
  fields: {
    ...fileInterfaceFields(),
    imageRatio: { type: GraphQLFloat },
    metadata: { type: imageMetadataSummaryType },
    blurHash: { type: new GraphQLNonNull(GraphQLString) },
  },
});
