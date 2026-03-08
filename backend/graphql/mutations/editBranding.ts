import { requireFullAdmin } from '../queries/admins.js';
import {
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { brandingType } from '../types/brandingType.js';
import { db } from '../../db/picrDb.js';
import { eq } from 'drizzle-orm';
import { dbBranding } from '../../db/models/index.js';
import {
  headingFontKeyEnum,
  primaryColorEnum,
  themeModeEnum,
} from '../types/enums.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import type { MutationEditBrandingArgs } from '@shared/gql/graphql.js';
import type { SocialLink } from '@shared/branding/socialLinkTypes.js';
import { normalizeSocialLinks } from '@shared/branding/socialLinkTypes.js';
import { normalizeHeadingFontKey } from '../helpers/headingFontKey.js';
import { GraphQLError } from 'graphql/error/index.js';

const KNOWN_VIEWS = ['list', 'gallery', 'feed'] as const;
type KnownView = (typeof KNOWN_VIEWS)[number];

// Extends generated args with new fields until next codegen run
type EditBrandingArgs = MutationEditBrandingArgs & {
  availableViews?: string[] | null;
  defaultView?: string | null;
  thumbnailSize?: number | null;
  thumbnailSpacing?: number | null;
  thumbnailBorderRadius?: number | null;
  headingFontSize?: number | null;
  headingAlignment?: string | null;
  footerTitle?: string | null;
  footerUrl?: string | null;
  socialLinks?: SocialLink[] | null;
};

const resolver: PicrResolver<object, EditBrandingArgs> = async (
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

  // Normalize availableViews: empty array → null (unrestricted)
  let availableViews: KnownView[] | null | undefined = undefined;
  if (params.availableViews !== undefined) {
    if (params.availableViews === null || params.availableViews.length === 0) {
      availableViews = null;
    } else {
      for (const v of params.availableViews) {
        if (!(KNOWN_VIEWS as readonly string[]).includes(v)) {
          throw new GraphQLError(`Unknown view: ${v}`);
        }
      }
      availableViews = params.availableViews as KnownView[];
    }
  }

  // Normalize defaultView: must be a known view; if availableViews is
  // restricted in this same call, auto-correct to first available view
  let defaultView: string | null | undefined = undefined;
  if (params.defaultView !== undefined) {
    if (params.defaultView === null) {
      defaultView = null;
    } else {
      if (!(KNOWN_VIEWS as readonly string[]).includes(params.defaultView)) {
        throw new GraphQLError(`Unknown view: ${params.defaultView}`);
      }
      if (
        availableViews !== undefined &&
        availableViews !== null &&
        !availableViews.includes(params.defaultView as KnownView)
      ) {
        defaultView = availableViews[0];
      } else {
        defaultView = params.defaultView;
      }
    }
  }

  // If views are explicitly restricted and defaultView was omitted, force
  // defaultView to the first restricted option.
  if (
    params.defaultView === undefined &&
    availableViews !== undefined &&
    availableViews !== null
  ) {
    defaultView = availableViews[0];
  }

  // Validate heading alignment
  if (
    params.headingAlignment !== undefined &&
    params.headingAlignment !== null &&
    !['left', 'center', 'right'].includes(params.headingAlignment)
  ) {
    throw new GraphQLError(
      `headingAlignment must be 'left', 'center', or 'right'`,
    );
  }

  const props = {
    name: params.name,
    mode: params.mode,
    primaryColor: params.primaryColor,
    logoUrl: params.logoUrl,
    headingFontKey,
    availableViews,
    defaultView,
    thumbnailSize: params.thumbnailSize,
    thumbnailSpacing: params.thumbnailSpacing,
    thumbnailBorderRadius: params.thumbnailBorderRadius,
    headingFontSize: params.headingFontSize,
    headingAlignment: params.headingAlignment,
    footerTitle: params.footerTitle,
    footerUrl: params.footerUrl,
    socialLinks: normalizeSocialLinks(params.socialLinks),
    updatedAt: new Date(),
  };

  if (params.id) {
    const existing = await db.query.dbBranding.findFirst({
      where: eq(dbBranding.id, params.id),
    });

    if (!existing) {
      throw new GraphQLError('Branding not found: ' + params.id);
    }

    await db.update(dbBranding).set(props).where(eq(dbBranding.id, params.id));

    return db.query.dbBranding.findFirst({
      where: eq(dbBranding.id, params.id),
    });
  } else {
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
  },
};
