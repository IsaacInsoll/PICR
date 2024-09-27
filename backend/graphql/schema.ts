import { GraphQLObjectType, GraphQLSchema } from 'graphql';
import { auth } from './mutations/auth';
import { editUser } from './mutations/editUser';
import { editAdminUser } from './mutations/editAdminUser';
import { generateThumbnails } from './mutations/generateThumbnails';
import { generateZip } from './mutations/generateZip';
import { folder } from './queries/folder';
import { file } from './queries/file';
import { tasks } from './queries/task';
import { users } from './queries/users';
import { user } from './queries/user';
import { admins } from './queries/admins';
import { allFolders } from './queries/allFolders';
import { me } from './queries/me';
import { folderType } from './types/folderType';
import { fileInterface } from './interfaces/fileInterface';
import { fileType } from './types/fileType';
import { imageFileType } from './types/imageFileType';
import { videoFileType } from './types/videoFileType';
import { folderPermissionsType } from './types/folderPermissionsType';
import { imageMetadataSummaryType } from './types/imageMetadataSummaryType';
import { videoMetadataSummaryType } from './types/videoMetadataSummaryType';
import { userType } from './types/userType';
import { taskType } from './types/taskType';

const queries = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    /* General Purpose */
    folder,
    file,
    tasks,
    /* Admin Only */
    users,
    user,
    admins,
    allFolders,
    me,
  }),
});

const mutations = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    auth,
    editUser,
    editAdminUser,
    generateThumbnails,
    generateZip,
  }),
});

const types = [
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
];

export const schema = new GraphQLSchema({
  query: queries,
  mutation: mutations,
  types: types,
});
