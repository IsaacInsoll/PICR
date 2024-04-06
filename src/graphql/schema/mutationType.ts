import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { authMutation } from '../mutations/authMutation';
import { userType } from './userType';
import { editUser } from '../mutations/editUser';
import { generateThumbnails } from '../mutations/generateThumbnails';

export const mutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    auth: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: authMutation,
      args: {
        user: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
      },
    },
    editUser: {
      type: new GraphQLNonNull(userType),
      resolve: editUser,
      args: {
        id: { type: GraphQLID },
        folderId: { type: GraphQLID },
        name: { type: GraphQLString },
        uuid: { type: GraphQLString },
        enabled: { type: GraphQLBoolean },
      },
    },
    generateThumbnails: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: generateThumbnails,
      args: {
        folderId: { type: GraphQLID },
      },
    },
  }),
});
