import {
  GraphQLID,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { folderType } from './folderType';

export const taskType = new GraphQLObjectType({
  name: 'Task',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: new GraphQLNonNull(GraphQLString) },
    step: { type: GraphQLInt },
    totalSteps: { type: GraphQLInt },
    startTime: { type: GraphQLString },
    folder: { type: folderType },
    status: { type: GraphQLString }, // TODO: make it an enum
  }),
});
