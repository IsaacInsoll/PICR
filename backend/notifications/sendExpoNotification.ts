import {
  Expo,
  ExpoPushMessage,
  ExpoPushReceiptId,
  ExpoPushToken,
} from 'expo-server-sdk';
import { NotificationPayload } from './notifications.js';
import { db } from '../db/picrDb.js';
import { dbUserDevice } from '../db/models/index.js';
import { eq } from 'drizzle-orm';

const expo = new Expo({
  // we will enable this if there is abuse of notifications :)
  // accessToken: process.env.EXPO_ACCESS_TOKEN,
});

export interface ExpoNotifications {
  token?: string | null;
  payload: NotificationPayload;
}

export const sendExpoNotifications = async (
  notifications: ExpoNotifications[],
) => {
  // Create the messages that you want to send to clients
  const messages: ExpoPushMessage[] = [];
  for (const { token, payload } of notifications) {
    if (!Expo.isExpoPushToken(token)) {
      console.error(`Push token ${token} is not a valid Expo push token`);
      continue;
    }

    // replace URL with one that will open in the app
    const targetUrl = payload.url?.startsWith('https://')
      ? 'picr://' + payload.url?.substring(8)
      : payload.url;

    // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
    messages.push({
      to: token,
      title: payload.title,
      body: payload.message,
      sound: 'default',
      data: { url: targetUrl },
      richContent: {
        image: payload.imageUrl,
      },
    });
  }

  try {
    const tickets = await expo.sendPushNotificationsAsync(messages);
    tickets.forEach((ticket, index) => {
      const receiptIds: ExpoPushReceiptId[] = [];
      if (ticket.status === 'ok' && ticket.id) {
        receiptIds.push(ticket.id);
      }
      if (ticket.status == 'error') {
        const messageTarget = messages[index]?.to;
        if (ticket.details?.error == 'DeviceNotRegistered') {
          if (typeof messageTarget === 'string') {
            disableToken(messageTarget as ExpoPushToken);
          }
        } else if (ticket.details?.error == 'InvalidCredentials') {
          console.log(
            `InvalidCredentials error when sending push notification to ${String(messageTarget)}`,
          );
        } else {
          console.log('ticket.status==error');
          console.log(ticket.details);
        }
      }
      if (receiptIds.length > 0) {
        setTimeout(() => checkReceipts(receiptIds), 60 * 60 * 1000);
      }
    });
  } catch (error) {
    console.error(error);
  }
};

const checkReceipts = async (receiptIds: ExpoPushReceiptId[]) => {
  const receipts = await expo.getPushNotificationReceiptsAsync(receiptIds);
  console.log('checking receipts', receipts);
  try {
    for (const receiptId in receipts) {
      const receipt = receipts[receiptId];
      if (receipt.status === 'ok') {
        continue;
      } else if (receipt.status === 'error') {
        console.error(
          `There was an error sending a notification: ${receipt?.message}`,
        );
        if (receipt.details && receipt.details.error) {
          console.error(`The error code is ${receipt.details.error}`);
          if (
            disableList.includes(receipt.details.error) &&
            receipt.details.expoPushToken
          ) {
            disableToken(receipt.details.expoPushToken);
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
};

// turn off notifications for this token because they are bouncing back and we don't want to get banned
const disableToken = async (token: ExpoPushToken) => {
  console.log(`Disable token: ${token}`);
  await db
    .update(dbUserDevice)
    .set({ enabled: false })
    .where(eq(dbUserDevice.notificationToken, token));
};
// These types of errors should cause us to disable notifications for this token
const disableList = ['DeviceNotRegistered', 'MessageRateExceeded'];
