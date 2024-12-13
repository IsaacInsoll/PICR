import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { folderType } from './folderType';
import { commentPermissionsEnum } from '../enums/commentPermissionsEnum';

export const userType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    uuid: { type: GraphQLString }, // can be null if 'real user'
    username: { type: GraphQLString }, // null if not 'real user'
    enabled: { type: GraphQLBoolean },
    folderId: { type: new GraphQLNonNull(GraphQLID) },
    folder: { type: folderType },
    commentPermissions: { type: commentPermissionsEnum },
    gravatar: {type: GraphQLString}
  }),
});
