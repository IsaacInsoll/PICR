import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { folderType } from './folderType';
import { GraphQLDateTime } from 'graphql-scalars';
import { userType } from './userType';
import { accessTypeEnum } from '../enums/accessTypeEnum';

export const accessLogType = new GraphQLObjectType({
  name: 'AccessLog',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    timestamp: { type: new GraphQLNonNull(GraphQLDateTime) },
    type: { type: new GraphQLNonNull(accessTypeEnum) },
    user: { type: userType },
    userId: { type: GraphQLID },
    folder: { type: folderType },
    folderId: { type: GraphQLID },
    ipAddress: { type: GraphQLString },
    userAgent: { type: GraphQLString },
  }),
});
