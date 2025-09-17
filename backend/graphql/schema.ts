import { GraphQLObjectType, GraphQLSchema } from 'graphql';
import { auth } from './mutations/auth.js';
import { editUser } from './mutations/editUser.js';
import { editAdminUser } from './mutations/editAdminUser.js';
import { generateThumbnails } from './mutations/generateThumbnails.js';
import { generateZip } from './mutations/generateZip.js';
import { folder } from './queries/folder.js';
import { file } from './queries/file.js';
import { tasks } from './queries/task.js';
import { users } from './queries/users.js';
import { user } from './queries/user.js';
import { admins } from './queries/admins.js';
import { allFolders } from './queries/allFolders.js';
import { me } from './queries/me.js';
import { folderType } from './types/folderType.js';
import { fileInterface } from './interfaces/fileInterface.js';
import { fileType } from './types/fileType.js';
import { imageFileType } from './types/imageFileType.js';
import { videoFileType } from './types/videoFileType.js';
import { folderPermissionsType } from './types/folderPermissionsType.js';
import { imageMetadataSummaryType } from './types/imageMetadataSummaryType.js';
import { videoMetadataSummaryType } from './types/videoMetadataSummaryType.js';
import { userType } from './types/userType.js';
import { taskType } from './types/taskType.js';
import { addComment } from './mutations/addComment.js';
import { commentType } from './types/commentType.js';
import { comments } from './queries/comments.js';
import { serverInfoType } from './types/serverInfoType.js';
import { serverInfo } from './queries/serverInfoQuery.js';
import { searchFolders } from './queries/searchFolders.js';
import { searchFiles } from './queries/searchFiles.js';
import { editFolder } from './mutations/editFolder.js';
import { brandingType } from './types/brandingType.js';
import { brandings } from './queries/brandings.js';
import { editBranding } from './mutations/editBranding.js';
import { deleteBranding } from './mutations/deleteBranding.js';
import { accessLogs } from './queries/accessLogs.js';
import { accessLogType } from './types/accessLogType.js';
import { clientInfo } from './queries/clientInfoQuery.js';
import { clientInfoType } from './types/clientInfoType.js';
import { accessTypeEnum, userTypeEnum } from './types/enums.js';
import { userDeviceType } from './types/userDeviceType.js';
import { editUserDevice } from './mutations/editUserDevice.js';
import { userDevices } from './queries/userDevices.js';
import { renameFolder } from './mutations/renameFolder.js';

const queries = new GraphQLObjectType({
  fields: () => ({
    /* General Purpose */
    admins,
    allFolders,
    brandings,
    clientInfo,
    comments,
    file,
    /* Admin Only */
    accessLogs,
    folder,
    me,
    searchFiles,
    searchFolders,
    tasks,
    user,
    userDevices,
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
    editFolder,
    editBranding,
    deleteBranding,
    editUserDevice,
    renameFolder,
  }),
});

const types = [
  accessTypeEnum,
  accessLogType,
  brandingType,
  clientInfoType,
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
  userDeviceType,
  videoFileType,
  videoMetadataSummaryType,
  userTypeEnum,
];

export const schema = new GraphQLSchema({
  query: queries,
  mutation: mutations,
  types: types,
});
