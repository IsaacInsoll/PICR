import { GraphQLSchema } from 'graphql';
import { fileType } from './fileType';
import { metadataSummaryType } from './metadataSummaryType';
import { folderPermissionsType } from './folderPermissionsType';
import { userType } from './userType';
import { folderType } from './folderType';
import { queryType } from './queryType';
import { mutationType } from './mutationType';
import { taskType } from './taskType';

export const schema = new GraphQLSchema({
  query: queryType,
  mutation: mutationType,
  types: [
    folderType,
    fileType,
    folderPermissionsType,
    metadataSummaryType,
    userType,
    taskType,
  ],
});
