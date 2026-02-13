import { requireFullAdmin } from '../queries/admins.js';
import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql';
import { brandingType } from '../types/brandingType.js';
import { db } from '../../db/picrDb.js';
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
import { GraphQLError } from 'graphql/error/index.js';

const resolver: GraphQLFieldResolver<unknown, PicrRequestContext> = async (
  _,
  params,
  context,
) => {
  await requireFullAdmin(context);

  const headingFontKey =
    params.headingFontKey === undefined
      ? undefined
      : params.headingFontKey === null
        ? null
        : normalizeHeadingFontKey(params.headingFontKey);

  const props = {
    name: params.name,
    mode: params.mode,
    primaryColor: params.primaryColor,
    headingFontKey,
    updatedAt: new Date(),
  };

  if (params.id) {
    // Update existing branding
    const existing = await db.query.dbBranding.findFirst({
      where: eq(dbBranding.id, params.id),
    });

    if (!existing) {
      throw new GraphQLError('Branding not found: ' + params.id);
    }

    await db
      .update(dbBranding)
      .set(props)
      .where(eq(dbBranding.id, params.id));

    return db.query.dbBranding.findFirst({
      where: eq(dbBranding.id, params.id),
    });
  } else {
    // Create new branding - name is required
    if (!params.name) {
      throw new GraphQLError('Name is required when creating a new branding');
    }

    const result = await db
      .insert(dbBranding)
      .values({ ...props, createdAt: new Date() })
      .returning();

    return result[0];
  }
};

export const editBranding = {
  type: new GraphQLNonNull(brandingType),
  resolve: resolver,
  args: {
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    mode: { type: themeModeEnum },
    primaryColor: { type: primaryColorEnum },
    logoUrl: { type: GraphQLString },
    headingFontKey: { type: headingFontKeyEnum },
  },
};
