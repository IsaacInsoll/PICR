import { contextPermissionsForFolder as perms } from '../../auth/contextPermissionsForFolder';
import { Folder } from '../../../graphql-types';
import { GraphQLFieldResolver } from 'graphql/type';
import { IncomingCustomHeaders } from '../../types/incomingCustomHeaders';
import { getFolder } from '../helpers/getFolder';
import { GraphQLID, GraphQLNonNull } from 'graphql/index';
import { folderType } from '../types/folderType';
import { accessLogTable } from '../../db/models/accessLogTable';
import { db } from '../../server';

const folderResolver: GraphQLFieldResolver<
  Folder,
  IncomingCustomHeaders
> = async (_, params, context, info): Promise<Folder> => {
  const [permissions, u] = await perms(context, params.id, true);
  const f = await getFolder(params.id);
  const data = { ...f, permissions };
  await createAccessLog(u.id, f.id);
  return data;
};

export const folder = {
  type: new GraphQLNonNull(folderType),
  resolve: folderResolver,
  args: { id: { type: new GraphQLNonNull(GraphQLID) } },
};

export const createAccessLog = async (userId: number, folderId: number) => {
  //await db.insert(users).values({ name: 'Andrew' });

  await db
    .insert(accessLogTable)
    .values({ userId, folderId, updatedAt: new Date() });

  // const log = new AccessLog();
  // log.userId = userId;
  // log.folderId = folderId;
  // log.save();
};
