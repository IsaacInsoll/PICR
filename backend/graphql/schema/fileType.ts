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
import { GraphQLBigInt, GraphQLDate, GraphQLDateTime } from 'graphql-scalars';

const fileTypeFields = {
  id: { type: new GraphQLNonNull(GraphQLID) },
  type: { type: new GraphQLNonNull(fileTypeEnum) },
  name: { type: new GraphQLNonNull(GraphQLString) },
  folderId: { type: new GraphQLNonNull(GraphQLID) },
  fileHash: { type: new GraphQLNonNull(GraphQLString) },
  fileSize: { type: new GraphQLNonNull(GraphQLBigInt) }, //custom BigInt as Int only goes to 2gb (32bit)
  fileLastModified: { type: new GraphQLNonNull(GraphQLDateTime) }, //custom BigInt as Int only goes to 2gb (32bit)
};

export const fileInterface = new GraphQLInterfaceType({
  name: 'FileInterface',
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
  interfaces: [fileInterface],
  fields: {
    ...fileTypeFields,
    imageRatio: { type: GraphQLFloat },
    metadata: { type: metadataSummaryType },
  },
});

export const videoFileType = new GraphQLObjectType({
  name: 'Video',
  interfaces: [fileInterface],
  fields: {
    ...fileTypeFields,
    imageRatio: { type: GraphQLFloat },
    metadata: { type: metadataSummaryType },
    duration: { type: GraphQLFloat },
  },
});

export const fileType = new GraphQLObjectType({
  name: 'File',
  interfaces: [fileInterface],
  fields: {
    ...fileTypeFields,
    // imageRatio: { type: GraphQLFloat },
    // metadata: { type: metadataSummaryType },
    // duration: { type: GraphQLFloat },
  },
});
