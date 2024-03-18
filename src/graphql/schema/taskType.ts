import {
  GraphQLBoolean,
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
    step: { type: new GraphQLNonNull(GraphQLInt) },
    totalSteps: { type: new GraphQLNonNull(GraphQLInt) },
    startTime: { type: GraphQLString },
    folder: { type: folderType },
  }),
});
