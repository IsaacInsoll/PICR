import {
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { folderType } from './folderType.js';
import {
  headingFontKeyEnum,
  primaryColorEnum,
  themeModeEnum,
} from './enums.js';
import { normalizeHeadingFontKey } from '../helpers/headingFontKey.js';
import { db } from '../../db/picrDb.js';
import { eq } from 'drizzle-orm';
import { dbFolder } from '../../db/models/index.js';

export const brandingType = new GraphQLObjectType({
  name: 'Branding',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: GraphQLString },
    mode: { type: themeModeEnum },
    primaryColor: { type: primaryColorEnum },
    logoUrl: { type: GraphQLString },
    headingFontKey: {
      type: headingFontKeyEnum,
      resolve: (branding) => normalizeHeadingFontKey(branding?.headingFontKey),
    },
    availableViews: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
    },
    defaultView: { type: GraphQLString },
    thumbnailSize: { type: GraphQLInt },
    thumbnailSpacing: { type: GraphQLInt },
    thumbnailBorderRadius: { type: GraphQLInt },
    headingFontSize: { type: GraphQLInt },
    headingAlignment: { type: GraphQLString },
    footerTitle: { type: GraphQLString },
    footerUrl: { type: GraphQLString },
    socialLinks: { type: GraphQLJSON },
    // TODO: Remove folderId in a future release - kept for backwards compatibility
    folderId: { type: GraphQLID },
    folder: { type: folderType },
    folders: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(folderType))),
      resolve: async (branding) => {
        return db.query.dbFolder.findMany({
          where: eq(dbFolder.brandingId, branding.id),
        });
      },
    },
  }),
});
