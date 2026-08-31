import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { thumbnailVariantLadderForSettings } from '@shared/thumbnailVariants.js';

export const thumbnailVariantType = new GraphQLObjectType({
  name: 'ThumbnailVariant',
  fields: () => ({
    token: { type: new GraphQLNonNull(GraphQLString) },
    width: { type: new GraphQLNonNull(GraphQLInt) },
    format: { type: new GraphQLNonNull(GraphQLString) },
    mimeType: { type: new GraphQLNonNull(GraphQLString) },
    quality: { type: new GraphQLNonNull(GraphQLInt) },
  }),
});

export const serverSettingsType = new GraphQLObjectType({
  name: 'ServerSettings',
  fields: () => ({
    useOriginalsForLightbox: { type: new GraphQLNonNull(GraphQLBoolean) },
    thumbnailJpegQuality: { type: new GraphQLNonNull(GraphQLInt) },
    thumbnailVariants: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(thumbnailVariantType)),
      ),
      resolve: (settings: { thumbnailJpegQuality: number }) =>
        thumbnailVariantLadderForSettings(settings),
    },
  }),
});
