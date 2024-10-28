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
import { addComment } from './mutations/addComment';
import { commentType } from './types/commentType';
import { comments } from './queries/comments';
import { serverInfoType } from './types/serverInfoType';
import { serverInfo } from './queries/serverInfoQuery';
import { searchFolders } from './queries/searchFolders';
import { searchFiles } from './queries/searchFiles';

const queries = new GraphQLObjectType({
  fields: () => ({
    /* General Purpose */
    admins,
    allFolders,
    comments,
    file,
    /* Admin Only */
    folder,
    me,
    searchFiles,
    searchFolders,
    tasks,
    user,
    users,
    serverInfo,
  }),
  name: 'Query',
});

const mutations = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    addComment,
    auth,
    editAdminUser,
    editUser,
    generateThumbnails,
    generateZip,
  }),
});

const types = [
  commentType,
  fileInterface,
  fileType,
  folderType,
  folderPermissionsType,
  imageFileType,
  imageMetadataSummaryType,
  serverInfoType,
  taskType,
  userType,
  videoFileType,
  videoMetadataSummaryType,
];

export const schema = new GraphQLSchema({
  query: queries,
  mutation: mutations,
  types: types,
});
