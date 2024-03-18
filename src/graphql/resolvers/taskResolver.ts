import { contextPermissionsForFolder as perms } from '../../auth/contextPermissionsForFolder';
import { getFolder } from './resolverHelpers';
import { getUserFromToken } from '../../auth/jwt-auth';
import { doAuthError } from '../../auth/doAuthError';
import { queueTaskStatus } from '../../filesystem/fileQueue';

export const taskResolver = async (_, params, context) => {
  let f = null;
  if (params.folderId) {
    const [permissions, u] = await perms(context, params.id, true);
    f = await getFolder(params.id);
  } else {
    const user = await getUserFromToken(context);
    if (!user)
      doAuthError('You must specify a folder or be an admin user to see all');
  }

  //temorarily always show this progress while developing

  // id: { type: GraphQLID },
  //     name: { type: new GraphQLNonNull(GraphQLString) },
  //     step: { type: new GraphQLNonNull(GraphQLInt) },
  //     totalSteps: { type: new GraphQLNonNull(GraphQLInt) },
  //     startTime: { type: GraphQLString },
  //     folder: { type: folderType },
  const thumbs = queueTaskStatus();
  if (thumbs) return [thumbs];
  return [];
};
