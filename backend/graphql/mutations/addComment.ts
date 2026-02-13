import {
  GraphQLFieldResolver,
  GraphQLID,
  GraphQLNonNull,
} from 'graphql/type/index.js';
import { contextPermissions } from '../../auth/contextPermissions.js';
import { doAuthError } from '../../auth/doAuthError.js';
import { fileToJSON } from '../helpers/fileToJSON.js';
import { GraphQLInt, GraphQLString } from 'graphql';
import { fileInterface } from '../interfaces/fileInterface.js';
import { GraphQLError } from 'graphql/error/index.js';
import { addCommentDB, db, dbFileForId } from '../../db/picrDb.js';
import { dbFile } from '../../db/models/index.js';
import { eq } from 'drizzle-orm';
import { fileFlagEnum } from '../types/enums.js';
import { sendCommentAddedNotification } from '../../notifications/notifications.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';
import { Comment } from '../../../graphql-types.js';

const resolver: GraphQLFieldResolver<Comment, PicrRequestContext> = async (
  _,
  params,
  context,
) => {
  const file = await dbFileForId(params.id);
  const { user, folder } = await contextPermissions(
    context,
    file?.folderId,
    'View',
  );
  if (!file?.exists) throw new GraphQLError('File not found');

  if (user?.commentPermissions != 'edit') doAuthError('COMMENTS_NOT_ALLOWED');
  if (!user) return; // not needed, just for typescript to know it's not null at this point

  //TODO: set rating, flag
  if (params.rating != null) {
    file.rating = params.rating;
    await addCommentDB(file, user, { rating: params.rating });
    await sendCommentAddedNotification(
      folder,
      file,
      user,
      'rated',
      params.rating + ' stars',
    );
  }
  if (params.flag) {
    file.flag = params.flag == 'none' ? null : params.flag;
    await addCommentDB(file, user, { flag: params.flag });
    await sendCommentAddedNotification(
      folder,
      file,
      user,
      'flagged',
      params.flag,
    );
  }

  if (params.comment) {
    await addCommentDB(file, user, undefined, params.comment);
    file.totalComments = file.totalComments + 1;
    const short =
      params.comment.length > 20
        ? params.comment.substring(0, 20) + '...'
        : params.comment;
    await sendCommentAddedNotification(
      folder,
      file,
      user,
      'commented',
      `"${short}"`,
    );
  }

  file.latestComment = new Date();
  await db
    .update(dbFile)
    .set({ ...file })
    .where(eq(dbFile.id, file.id));
  return fileToJSON(file);
};

export const addComment = {
  type: new GraphQLNonNull(fileInterface),
  resolve: resolver,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    // All these are optional
    nickName: { type: GraphQLString },
    rating: { type: GraphQLInt },
    flag: { type: fileFlagEnum },
    comment: { type: GraphQLString },
  },
};
