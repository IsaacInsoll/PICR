import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
} from 'graphql';

export const thumbnailDimensionsType = new GraphQLObjectType({
  name: 'ThumbnailDimensions',
  fields: () => ({
    sm: { type: new GraphQLNonNull(GraphQLInt) },
    md: { type: new GraphQLNonNull(GraphQLInt) },
    lg: { type: new GraphQLNonNull(GraphQLInt) },
  }),
});

export const serverSettingsType = new GraphQLObjectType({
  name: 'ServerSettings',
  fields: () => ({
    useOriginalsForLightbox: { type: new GraphQLNonNull(GraphQLBoolean) },
    thumbnailSmallPx: { type: new GraphQLNonNull(GraphQLInt) },
    thumbnailMediumPx: { type: new GraphQLNonNull(GraphQLInt) },
    thumbnailLargePx: { type: new GraphQLNonNull(GraphQLInt) },
    thumbnailJpegQuality: { type: new GraphQLNonNull(GraphQLInt) },
    thumbnailDimensions: {
      type: new GraphQLNonNull(thumbnailDimensionsType),
    },
  }),
});
