import {
  GraphQLFloat,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import {
  fileInterface,
  fileInterfaceFields,
} from '../interfaces/fileInterface.js';
import { imageMetadataSummaryType } from './imageMetadataSummaryType.js';

export const imageFileType = new GraphQLObjectType({
  name: 'Image',
  interfaces: [fileInterface],
  fields: () => ({
    ...fileInterfaceFields(),
    imageWidth: { type: GraphQLInt },
    imageHeight: { type: GraphQLInt },
    imageRatio: { type: GraphQLFloat },
    metadata: { type: imageMetadataSummaryType },
    blurHash: { type: GraphQLString },
  }),
});
