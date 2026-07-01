import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { publicLinkBrandingPreviewType } from './publicLinkBrandingPreviewType.js';

export const publicLinkInfoType = new GraphQLObjectType({
  name: 'PublicLinkInfo',
  fields: () => ({
    available: { type: new GraphQLNonNull(GraphQLBoolean) },
    requiresPasscode: { type: new GraphQLNonNull(GraphQLBoolean) },
    unlocked: { type: new GraphQLNonNull(GraphQLBoolean) },
    galleryName: { type: GraphQLString },
    branding: { type: publicLinkBrandingPreviewType },
  }),
});
