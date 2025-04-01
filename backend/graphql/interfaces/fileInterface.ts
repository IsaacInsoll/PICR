import {
  GraphQLID,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql/index';
import { GraphQLBigInt, GraphQLDateTime } from 'graphql-scalars';
import { folderType } from '../types/folderType';
import { fileFlagEnum, fileTypeEnum } from '../types/enums';

export const fileInterfaceFields = () => ({
  id: { type: new GraphQLNonNull(GraphQLID) },
  type: { type: new GraphQLNonNull(fileTypeEnum) },
  flag: { type: fileFlagEnum },
  rating: { type: GraphQLInt },
  totalComments: { type: GraphQLInt },
  name: { type: new GraphQLNonNull(GraphQLString) },
  folderId: { type: new GraphQLNonNull(GraphQLID) },
  folder: { type: folderType },
  fileHash: { type: new GraphQLNonNull(GraphQLString) },
  fileSize: { type: new GraphQLNonNull(GraphQLBigInt) }, //custom BigInt as Int only goes to 2gb (32bit)
  fileLastModified: { type: new GraphQLNonNull(GraphQLDateTime) },
  latestComment: { type: GraphQLDateTime },
});
export const fileInterface = new GraphQLInterfaceType({
  name: 'FileInterface',
  resolveType: (file) => file.type,
  fields: () => ({
    ...fileInterfaceFields(),
  }),
});
