import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { userType } from "./userType.js";
import { GraphQLDateTime } from 'graphql-scalars';
import { fileType } from "./fileType.js";

export const commentType = new GraphQLObjectType({
  name: 'Comment',
  fields: () => ({
    id: { type: GraphQLID },
    userId: { type: GraphQLID },
    timestamp: { type: new GraphQLNonNull(GraphQLDateTime) },
    comment: { type: GraphQLString },
    user: { type: userType },
    systemGenerated: { type: new GraphQLNonNull(GraphQLBoolean) },
    file: { type: fileType },
  }),
});
