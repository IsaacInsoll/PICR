import { contextPermissions } from '../../auth/contextPermissions.js';
import { addToQueue } from '../../filesystem/fileQueue.js';
import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from 'graphql';
import { allSubfolderIds } from '../../helpers/allSubfolders.js';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { dbFile } from '../../db/models/index.js';
import { db } from '../../db/picrDb.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import type { MutationGenerateThumbnailsArgs } from '@shared/gql/graphql.js';
import { mediaTypeFilterEnum } from '../types/enums.js';
import { mediaTypesForThumbnailWork } from '../../media/mediaTypeFilter.js';

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
      inArray(dbFile.type, mediaTypesForThumbnailWork(params.mediaType)),
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
