import { requireFullAdmin } from '../queries/admins.js';
import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from 'graphql';
import { GraphQLError } from 'graphql/error/index.js';
import { brandingForId, db } from '../../db/picrDb.js';
import { dbBranding, dbFolder } from '../../db/models/index.js';
import { eq } from 'drizzle-orm';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';

const resolver: GraphQLFieldResolver<unknown, PicrRequestContext> = async (
  _,
  params,
  context: PicrRequestContext,
) => {
  await requireFullAdmin(context);

  const branding = await brandingForId(params.id);

  if (!branding) {
    throw new GraphQLError('Branding not found: ' + params.id);
  }

  // Clear brandingId on any folders using this branding
  await db
    .update(dbFolder)
    .set({ brandingId: null, updatedAt: new Date() })
    .where(eq(dbFolder.brandingId, params.id));

  // Delete the branding
  await db.delete(dbBranding).where(eq(dbBranding.id, params.id));

  return true;
};

export const deleteBranding = {
  type: new GraphQLNonNull(GraphQLBoolean),
  resolve: resolver,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
};
