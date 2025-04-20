import { FolderFields, UserFields } from '../db/picrDb';
import { AccessType } from '../../graphql-types';
import { folderAndAllParentIds } from '../helpers/folderAndAllParentIds';
import { usersForFolders } from '../helpers/usersForFolders';
import { sendNtfyNotification } from './sendNtfyNotification';

export type NotificationType = 'Download' | 'View';

export interface NotificationPayload {
  // title?: string; // it will just be 'PICR' or something like that for now
  message: string;
  url?: string;
  imageUrl?: string;
  type: NotificationType; // see https://docs.ntfy.sh/emojis/
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
    message: `${user.name} ${type.toLowerCase()}ed ${folder.name}`,
    type,
  });
};

const sendNotification = async (
  folder: FolderFields,
  payload: NotificationPayload,
) => {
  const folderIds = await folderAndAllParentIds(folder);
  const users = await usersForFolders(folderIds);
  const promises = users
    .filter((u) => !!u.ntfy)
    .map((u) => {
      return sendNtfyNotification(u.ntfy!, payload);
    });
  return await Promise.all(promises);
};
