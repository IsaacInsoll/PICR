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
import { videoMetadataSummaryType } from './videoMetadataSummaryType.js';

export const videoFileType = new GraphQLObjectType({
  name: 'Video',
  interfaces: [fileInterface],
  fields: {
    ...fileInterfaceFields(),
    imageWidth: { type: GraphQLInt },
    imageHeight: { type: GraphQLInt },
    imageRatio: { type: GraphQLFloat },
    metadata: { type: videoMetadataSummaryType },
    duration: { type: GraphQLFloat },
    blurHash: { type: GraphQLString },
  },
});
