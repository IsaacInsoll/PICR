import { FileFields, FolderFields, UserFields } from '../db/picrDb';
import { AccessType } from '../../graphql-types';
import { folderAndAllParentIds } from '../helpers/folderAndAllParentIds';
import { usersForFolders } from '../helpers/usersForFolders';
import { sendNtfyNotification } from './sendNtfyNotification';
import { urlForImage, userUrlForFile, userUrlForFolder } from '../helpers/url';

export type NotificationType =
  | 'downloaded'
  | 'viewed'
  | 'rated'
  | 'flagged'
  | 'commented';

export interface NotificationPayload {
  // title?: string; // it will just be 'PICR' or something like that for now
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
    message: `${user.name} ${type} ${folder.name}`,
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
    message: `${user.name} ${type} ${value} on ${file.name} in ${folder.name}`,
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
  const promises = users
    .filter((u) => !!u.ntfy && payload.userId != u.id)
    .map((u) => {
      return sendNtfyNotification(u.ntfy!, payload);
    });
  return await Promise.all(promises);
};
