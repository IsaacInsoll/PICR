import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { folderType } from './folderType.js';
import { headingFontKeyEnum, primaryColorEnum, themeModeEnum } from './enums.js';
import { normalizeHeadingFontKey } from '../helpers/headingFontKey.js';

export const brandingType = new GraphQLObjectType({
  name: 'Branding',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    mode: { type: themeModeEnum },
    primaryColor: { type: primaryColorEnum },
    logoUrl: { type: GraphQLString },
    headingFontKey: {
      type: headingFontKeyEnum,
      resolve: (branding) => normalizeHeadingFontKey(branding?.headingFontKey),
    },
    folderId: { type: new GraphQLNonNull(GraphQLID) },
    folder: { type: folderType },
  }),
});
