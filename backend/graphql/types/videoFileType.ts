import { GraphQLFloat, GraphQLObjectType } from 'graphql/index';
import {
  fileInterface,
  fileInterfaceFields,
} from '../interfaces/fileInterface';
import { videoMetadataSummaryType } from './videoMetadataSummaryType';

export const videoFileType = new GraphQLObjectType({
  name: 'Video',
  interfaces: [fileInterface],
  fields: {
    ...fileInterfaceFields(),
    imageRatio: { type: GraphQLFloat },
    metadata: { type: videoMetadataSummaryType },
    duration: { type: GraphQLFloat },
  },
});
