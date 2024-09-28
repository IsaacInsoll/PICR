import {
  GraphQLID,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql/index';
import { fileTypeEnum } from '../enums/fileTypeEnum';
import { fileFlagEnum } from '../enums/fileFlagEnum';
import { GraphQLBigInt, GraphQLDateTime } from 'graphql-scalars';

export const fileInterfaceFields = {
  id: { type: new GraphQLNonNull(GraphQLID) },
  type: { type: new GraphQLNonNull(fileTypeEnum) },
  flag: { type: fileFlagEnum },
  rating: { type: GraphQLInt },
  totalComments: { type: GraphQLInt },
  name: { type: new GraphQLNonNull(GraphQLString) },
  folderId: { type: new GraphQLNonNull(GraphQLID) },
  fileHash: { type: new GraphQLNonNull(GraphQLString) },
  fileSize: { type: new GraphQLNonNull(GraphQLBigInt) }, //custom BigInt as Int only goes to 2gb (32bit)
  fileLastModified: { type: new GraphQLNonNull(GraphQLDateTime) },
};
export const fileInterface = new GraphQLInterfaceType({
  name: 'FileInterface',
  resolveType: (file) => file.type,
  fields: () => ({
    ...fileInterfaceFields,
  }),
});
