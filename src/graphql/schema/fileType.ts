import {
  GraphQLFloat,
  GraphQLID,
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { metadataSummaryType } from './metadataSummaryType';
import { fileTypeEnum } from './fileTypeEnum';
import { GraphQLBigInt } from 'graphql-scalars';

const fileTypeFields = {
  id: { type: new GraphQLNonNull(GraphQLID) },
  type: { type: new GraphQLNonNull(fileTypeEnum) },
  name: { type: new GraphQLNonNull(GraphQLString) },
  folderId: { type: new GraphQLNonNull(GraphQLID) },
  fileHash: { type: new GraphQLNonNull(GraphQLString) },
  fileSize: { type: new GraphQLNonNull(GraphQLBigInt) }, //custom BigInt as Int only goes to 2gb (32bit)
};

export const fileType = new GraphQLInterfaceType({
  name: 'File',
  resolveType: (file) => file.type,
  fields: () => ({
    ...fileTypeFields,
    // imageRatio: { type: GraphQLFloat },
    // metadata: { type: metadataSummaryType },
    // duration: { type: GraphQLFloat },
  }),
});

export const imageFileType = new GraphQLObjectType({
  name: 'Image',
  interfaces: [fileType],
  fields: {
    ...fileTypeFields,
    imageRatio: { type: GraphQLFloat },
    metadata: { type: metadataSummaryType },
  },
});

export const videoFileType = new GraphQLObjectType({
  name: 'Video',
  interfaces: [fileType],
  fields: {
    ...fileTypeFields,
    imageRatio: { type: GraphQLFloat },
    metadata: { type: metadataSummaryType },
    duration: { type: GraphQLFloat },
  },
});
