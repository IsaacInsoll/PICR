import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { folderType } from './folderType';

export const userType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    uuid: { type: GraphQLString }, // can be null if 'real user'
    enabled: { type: new GraphQLNonNull(GraphQLBoolean) },
    folderId: { type: new GraphQLNonNull(GraphQLID) },
    folder: { type: folderType },
  }),
});
