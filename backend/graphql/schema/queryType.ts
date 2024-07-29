import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
} from 'graphql';
import { folderType } from './folderType';
import {
  allFoldersResolver,
  folderResolver,
} from '../resolvers/folderResolver';
import { fileInterface } from './fileType';
import { fileResolver } from '../resolvers/fileResolver';
import { userType } from './userType';
import {
  adminsResolver,
  userResolver,
  usersResolver,
} from '../resolvers/userResolver';
import { taskType } from './taskType';
import { taskResolver } from '../resolvers/taskResolver';

export const queryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    /* General Purpose */
    folder: {
      type: new GraphQLNonNull(folderType),
      resolve: folderResolver,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
    },
    file: {
      type: new GraphQLNonNull(fileInterface),
      resolve: fileResolver,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
    },
    tasks: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(taskType))),
      resolve: taskResolver,
      args: {
        folderId: { type: GraphQLID },
      },
    },
    /* Admin Only */
    users: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(userType))),
      resolve: usersResolver,
      args: {
        folderId: { type: new GraphQLNonNull(GraphQLID) },
        includeParents: { type: GraphQLBoolean },
      },
    },
    user: {
      type: new GraphQLNonNull(userType),
      resolve: userResolver,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
    },
    admins: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(userType))),
      resolve: adminsResolver,
    },
    allFolders: {
      type: new GraphQLNonNull(new GraphQLList(folderType)),
      resolve: allFoldersResolver,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
    },
  }),
});
