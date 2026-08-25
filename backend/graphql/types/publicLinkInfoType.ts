import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { GraphQLDateTime } from 'graphql-scalars';
import { publicLinkBrandingPreviewType } from './publicLinkBrandingPreviewType.js';

export const publicLinkAccessStatusType = new GraphQLEnumType({
  name: 'PublicLinkAccessStatus',
  values: {
    AVAILABLE: {},
    PASSCODE_REQUIRED: {},
    EXPIRED: {},
    UNAVAILABLE: {},
  },
});

export const publicLinkInfoType = new GraphQLObjectType({
  name: 'PublicLinkInfo',
  fields: () => ({
    status: { type: new GraphQLNonNull(publicLinkAccessStatusType) },
    expiresAt: {
      type: GraphQLDateTime,
      description:
        'Expiration timestamp for available and expired links. Available links carry it so a client holding a cached AVAILABLE result can still name the deadline the moment a request is rejected as expired; do not restrict this to EXPIRED. Hidden while a passcode is required and for unavailable links.',
    },
    available: {
      type: new GraphQLNonNull(GraphQLBoolean),
      deprecationReason: 'Use status.',
    },
    requiresPasscode: {
      type: new GraphQLNonNull(GraphQLBoolean),
      deprecationReason: 'Use status.',
    },
    unlocked: {
      type: new GraphQLNonNull(GraphQLBoolean),
      deprecationReason: 'Use status.',
    },
    galleryName: { type: GraphQLString },
    branding: { type: publicLinkBrandingPreviewType },
  }),
});
