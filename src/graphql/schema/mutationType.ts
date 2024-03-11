import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { authMutation } from '../authMutation';
import { userType } from './userType';
import { editUser } from '../editUser';

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
  }),
});
