import { contextPermissions } from '../../auth/contextPermissions';
import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql/index';
import { getFolder } from '../helpers/getFolder';
import { folderType } from '../types/folderType';
import { db } from '../../db/picrDb';
import { eq } from 'drizzle-orm';
import { dbBranding } from '../../db/models';
import { primaryColorEnum, themeModeEnum } from '../types/enums';

const resolver = async (_, params, context) => {
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

  return await getFolder(params.folderId);
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
