import { contextPermissions } from '../../auth/contextPermissions.js';
import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql';
import { folderType } from '../types/folderType.js';
import { db, dbFolderForId } from '../../db/picrDb.js';
import { eq } from 'drizzle-orm';
import { dbBranding } from '../../db/models/index.js';
import { primaryColorEnum, themeModeEnum } from '../types/enums.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';

const resolver = async (_, params, context: PicrRequestContext) => {
  await contextPermissions(context, params.folderId, 'Admin');

  const props = {
    mode: params.mode,
    primaryColor: params.primaryColor,
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
  },
};
