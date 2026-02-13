import { contextPermissions } from '../../auth/contextPermissions.js';
import { addToQueue } from '../../filesystem/fileQueue.js';
import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from 'graphql';
import { allSubfolderIds } from '../../helpers/allSubfolders.js';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { dbFile } from '../../db/models/index.js';
import { db } from '../../db/picrDb.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';

const resolver: GraphQLFieldResolver<unknown, PicrRequestContext> = async (
  _,
  params,
  context: PicrRequestContext,
) => {
  const { folder } = await contextPermissions(
    context,
    params.folderId,
    'Admin',
  );
  const folderIds = await allSubfolderIds(folder!);

  const files = await db.query.dbFile.findMany({
    columns: { id: true },
    where: and(inArray(dbFile.folderId, folderIds), eq(dbFile.exists, true)),
    orderBy: asc(dbFile.name),
  }); //.then(x=>x.map(f=>f.id));

  files?.map((f) => addToQueue('generateThumbnails', { id: f.id }));
  return true;
};

export const generateThumbnails = {
  type: new GraphQLNonNull(GraphQLBoolean),
  resolve: resolver,
  args: {
    folderId: { type: GraphQLID },
  },
};
