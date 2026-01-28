import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { fileInterface } from '../interfaces/fileInterface.js';

export const folderFileExportType = new GraphQLObjectType({
  name: 'FolderFileExport',
  fields: {
    file: { type: new GraphQLNonNull(fileInterface) },
    relativePath: { type: new GraphQLNonNull(GraphQLString) },
  },
});
