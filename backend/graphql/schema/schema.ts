import { GraphQLSchema } from 'graphql';
import {
  fileInterface,
  fileType,
  imageFileType,
  videoFileType,
} from './fileType';
import { imageMetadataSummaryType } from './imageMetadataSummaryType';
import { folderPermissionsType } from './folderPermissionsType';
import { userType } from './userType';
import { folderType } from './folderType';
import { queryType } from './queryType';
import { mutationType } from './mutationType';
import { taskType } from './taskType';
import { videoMetadataSummaryType } from './videoMetadataSummaryType';

export const schema = new GraphQLSchema({
  query: queryType,
  mutation: mutationType,
  types: [
    folderType,
    fileInterface,
    fileType,
    imageFileType,
    videoFileType,
    folderPermissionsType,
    imageMetadataSummaryType,
    videoMetadataSummaryType,
    userType,
    taskType,
  ],
});
