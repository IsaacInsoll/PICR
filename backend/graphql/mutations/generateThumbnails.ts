import { contextPermissions } from '../../auth/contextPermissions.js';
import { addToQueue } from '../../filesystem/fileQueue.js';
import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from 'graphql';
import { allSubfolderIds } from '../../helpers/allSubfolders.js';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { dbFile } from '../../db/models/index.js';
import { db } from '../../db/picrDb.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import {
  MediaTypeFilter,
  type MutationGenerateThumbnailsArgs,
} from '@shared/gql/graphql.js';
import { mediaTypeFilterEnum } from '../types/enums.js';

export const mediaTypesForGenerateThumbnails = (
  mediaType: MediaTypeFilter | null | undefined,
): readonly ['Image', 'Video'] | readonly ['Image'] | readonly ['Video'] => {
  if (mediaType === MediaTypeFilter.Image) {
    return ['Image'];
  }
  if (mediaType === MediaTypeFilter.Video) {
    return ['Video'];
  }
  return ['Image', 'Video'];
};

const resolver: PicrResolver<object, MutationGenerateThumbnailsArgs> = async (
  _,
  params,
  context,
) => {
  const { folder } = await contextPermissions(
    context,
    params.folderId,
    'Admin',
  );
  const folderIds = await allSubfolderIds(folder);

  const files = await db.query.dbFile.findMany({
    columns: { id: true },
    where: and(
      inArray(dbFile.folderId, folderIds),
      eq(dbFile.exists, true),
      inArray(dbFile.type, mediaTypesForGenerateThumbnails(params.mediaType)),
    ),
    orderBy: asc(dbFile.name),
  }); //.then(x=>x.map(f=>f.id));

  files.map((f) => addToQueue('generateThumbnails', { id: f.id }));
  return true;
};

export const generateThumbnails = {
  type: new GraphQLNonNull(GraphQLBoolean),
  resolve: resolver,
  args: {
    folderId: { type: GraphQLID },
    mediaType: { type: mediaTypeFilterEnum, defaultValue: 'All' },
  },
};
