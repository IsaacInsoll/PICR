import { db, FileFields, FolderFields, UserFields } from '../db/picrDb.js';
import { AccessType } from '../../graphql-types.js';
import { folderAndAllParentIds } from '../helpers/folderAndAllParentIds.js';
import { usersForFolders } from '../helpers/usersForFolders.js';
import { sendNtfyNotification } from './sendNtfyNotification.js';
import {
  urlForImage,
  userUrlForFile,
  userUrlForFolder,
} from '../helpers/url.js';
import { dbUserDevice } from '../db/models/index.js';
import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import {
  ExpoNotifications,
  sendExpoNotifications,
} from './sendExpoNotification.js';

export type NotificationType =
  | 'downloaded'
  | 'viewed'
  | 'rated'
  | 'flagged'
  | 'commented';

export interface NotificationPayload {
  title: string; // it will just be 'PICR' or something like that for now
  message: string;
  url?: string;
  imageUrl?: string;
  type: NotificationType; // see https://docs.ntfy.sh/emojis/
  userId?: number; // if specified, don't notify this user as they "created" the event
}

export const sendFolderViewedNotification = async (
  folder: FolderFields,
  user: UserFields,
  type: AccessType,
) => {
  // only notify if it's a 'public' user
  if (user.userType != 'Link') {
    return;
  }
  await sendNotification(folder, {
    title: user.name,
    message: `${type} ${folder.name}`,
    type: type == 'View' ? 'viewed' : 'downloaded',
    url: userUrlForFolder(folder.id),
  });
};

export const sendCommentAddedNotification = async (
  folder: FolderFields,
  file: FileFields,
  user: UserFields,
  type: NotificationType,
  value?: string,
) => {
  await sendNotification(folder, {
    title: user.name,
    message: `${type} ${value} on ${file.name} in ${folder.name}`,
    type,
    userId: user.id,
    url: userUrlForFile(file),
    imageUrl: urlForImage(file, 'sm'),
  });
};

const sendNotification = async (
  folder: FolderFields,
  payload: NotificationPayload,
) => {
  const folderIds = await folderAndAllParentIds(folder);
  const users = await usersForFolders(folderIds);
  const ntfys = users
    .filter((u) => !!u.ntfy && payload.userId != u.id)
    .map((u) => {
      return sendNtfyNotification(u.ntfy!, payload);
    });

  const userIds = users.map((u) => u.id).filter((i) => i != payload.userId);
  const devices = await db.query.dbUserDevice.findMany({
    where: and(
      inArray(dbUserDevice.userId, userIds),
      eq(dbUserDevice.enabled, true),
      isNotNull(dbUserDevice.notificationToken),
    ),
  });
  const expos: ExpoNotifications[] = devices.map(({ notificationToken }) => ({
    token: notificationToken,
    payload,
  }));

  const sendExpo = sendExpoNotifications(expos);

  return await Promise.all([...ntfys, sendExpo]);
};
