import { contextPermissions } from '../../auth/contextPermissions.js';
import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql';
import { folderType } from '../types/folderType.js';
import { db, dbFolderForId } from '../../db/picrDb.js';
import { eq } from 'drizzle-orm';
import { dbBranding } from '../../db/models/index.js';
import {
  headingFontKeyEnum,
  primaryColorEnum,
  themeModeEnum,
} from '../types/enums.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';
import { normalizeHeadingFontKey } from '../helpers/headingFontKey.js';

const resolver: GraphQLFieldResolver<any, PicrRequestContext> = async (
  _,
  params,
  context,
) => {
  await contextPermissions(context, params.folderId, 'Admin');

  const headingFontKey =
    params.headingFontKey === undefined
      ? undefined
      : params.headingFontKey === null
        ? null
        : normalizeHeadingFontKey(params.headingFontKey);

  const props = {
    mode: params.mode,
    primaryColor: params.primaryColor,
    headingFontKey,
    folderId: params.folderId,
    updatedAt: new Date(),
  };

  const existing = await db.query.dbBranding.findFirst({
    where: eq(dbBranding.folderId, params.folderId),
  });

  if (existing) {
    await db
      .update(dbBranding)
      .set(props)
      .where(eq(dbBranding.folderId, params.folderId));
  } else {
    await db.insert(dbBranding).values({ ...props, createdAt: new Date() });
  }

  return await dbFolderForId(params.folderId);
};

export const editBranding = {
  type: new GraphQLNonNull(folderType),
  resolve: resolver,
  args: {
    folderId: { type: new GraphQLNonNull(GraphQLID) },
    mode: { type: themeModeEnum },
    primaryColor: { type: primaryColorEnum },
    logoUrl: { type: GraphQLString },
    headingFontKey: { type: headingFontKeyEnum },
  },
};
