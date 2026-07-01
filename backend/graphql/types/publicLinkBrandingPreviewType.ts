import { GraphQLInt, GraphQLObjectType } from 'graphql';
import {
  headingAlignmentEnum,
  headingFontKeyEnum,
  primaryColorEnum,
  themeModeEnum,
} from './enums.js';

export const publicLinkBrandingPreviewType = new GraphQLObjectType({
  name: 'PublicLinkBrandingPreview',
  fields: () => ({
    mode: { type: themeModeEnum },
    primaryColor: { type: primaryColorEnum },
    headingFontKey: { type: headingFontKeyEnum },
    headingFontSize: { type: GraphQLInt },
    headingAlignment: { type: headingAlignmentEnum },
  }),
});
