import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
} from 'graphql';
import { folderFileExportType } from './folderFileExportType.js';

export const folderFilesResultType = new GraphQLObjectType({
  name: 'FolderFilesResult',
  fields: {
    files: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(folderFileExportType)),
      ),
    },
    totalAvailable: { type: new GraphQLNonNull(GraphQLInt) },
    totalReturned: { type: new GraphQLNonNull(GraphQLInt) },
    truncated: { type: new GraphQLNonNull(GraphQLBoolean) },
  },
});
