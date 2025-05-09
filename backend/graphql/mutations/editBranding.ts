import { contextPermissions } from '../../auth/contextPermissions';
import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql/index';
import { folderType } from '../types/folderType';
import { db, dbFolderForId } from '../../db/picrDb';
import { eq } from 'drizzle-orm';
import { dbBranding } from '../../db/models';
import { primaryColorEnum, themeModeEnum } from '../types/enums';
import { PicrRequestContext } from '../../types/PicrRequestContext';

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
