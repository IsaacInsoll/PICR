import { contextPermissions } from '../../auth/contextPermissions';
import { addToQueue } from '../../filesystem/fileQueue';
import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from 'graphql/index';
import { allSubfolderIds } from '../../helpers/allSubfolders';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { dbFile } from '../../db/models';
import { db } from '../../db/picrDb';
import { PicrRequestContext } from '../../types/PicrRequestContext';

const resolver = async (_, params, context: PicrRequestContext) => {
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
