import { contextPermissions } from '../../auth/contextPermissions';
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
} from 'graphql';
import { allSubfolders } from '../../helpers/allSubfolders';
import { accessLogType } from '../types/accessLogType';
import { addFolderRelationship } from '../helpers/addFolderRelationship';
import { db, getAccessLogs } from '../../db/picrDb';
import { eq, isNotNull } from 'drizzle-orm';
import { dbUser } from '../../db/models';
import { userTypeEnum } from '../types/enums';
import { PicrRequestContext } from '../../types/PicrRequestContext';

const resolver = async (_, params, context: PicrRequestContext) => {
  const { folder } = await contextPermissions(
    context,
    params.folderId,
    'Admin',
  );
  const ids = [folder!.id];

  if (params.includeChildren) {
    const children = await allSubfolders(folder!.id);
    const childIds = children.map(({ id }) => id);
    ids.push(...childIds);
  }

  //TODO: property filter by UserType, currently we force filter for Links which is fine for now
  // if(params.userType == UserType.Link) {

  const linkUsers = await db.query.dbUser.findMany({
    where: eq(dbUser.userType, 'Link'),
  });

  const linkUserIds = linkUsers.map((u) => u.id);

  const data = await getAccessLogs(ids, params.userId ?? linkUserIds);

  return addFolderRelationship(
    data.map((al) => {
      return { ...al, timestamp: al.createdAt };
    }),
  );
};

export const accessLogs = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(accessLogType))),
  resolve: resolver,
  args: {
    folderId: { type: new GraphQLNonNull(GraphQLID) },
    userId: { type: GraphQLID },
    includeChildren: { type: GraphQLBoolean },
    userType: { type: userTypeEnum },
  },
};
