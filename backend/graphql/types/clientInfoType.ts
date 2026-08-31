import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { thumbnailDimensionsType } from './serverSettingsType.js';

export const clientInfoType = new GraphQLObjectType({
  name: 'ClientInfo',
  fields: () => ({
    useOriginalsForLightbox: { type: new GraphQLNonNull(GraphQLBoolean) },
    thumbnailSmallPx: { type: new GraphQLNonNull(GraphQLInt) },
    thumbnailMediumPx: { type: new GraphQLNonNull(GraphQLInt) },
    thumbnailLargePx: { type: new GraphQLNonNull(GraphQLInt) },
    thumbnailJpegQuality: { type: new GraphQLNonNull(GraphQLInt) },
    thumbnailDimensions: {
      type: new GraphQLNonNull(thumbnailDimensionsType),
    },
    canWrite: { type: new GraphQLNonNull(GraphQLBoolean) },
    baseUrl: { type: new GraphQLNonNull(GraphQLString) },
  }),
});
