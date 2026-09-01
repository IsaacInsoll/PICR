import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { thumbnailVariantType } from './serverSettingsType.js';
import { thumbnailVariantLadderForSettings } from '@shared/thumbnailVariants.js';

export const clientInfoType = new GraphQLObjectType({
  name: 'ClientInfo',
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
    canWrite: { type: new GraphQLNonNull(GraphQLBoolean) },
    baseUrl: { type: new GraphQLNonNull(GraphQLString) },
  }),
});
