import {GraphQLFloat, GraphQLID, GraphQLNonNull, GraphQLObjectType, GraphQLString,} from 'graphql';
import {metadataSummaryType} from './metadataSummaryType';
import {fileTypeEnum} from './fileTypeEnum';
import {GraphQLBigInt} from 'graphql-scalars';

export const fileType = new GraphQLObjectType({
  name: 'File',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    type: { type: new GraphQLNonNull(fileTypeEnum) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    folderId: { type: new GraphQLNonNull(GraphQLID) },
    imageRatio: { type: GraphQLFloat },
    fileHash: { type: new GraphQLNonNull(GraphQLString) },
    metadata: { type: metadataSummaryType },
    fileSize: { type: new GraphQLNonNull(GraphQLBigInt) }, //custom BigInt as Int only goes to 2gb (32bit)
  }),
});
