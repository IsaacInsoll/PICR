import { NotificationPayload, NotificationType } from './notifications.js';

export const sendNtfyNotification = async (
  topic: string,
  payload: NotificationPayload,
  options?: { email?: string },
) => {
  const { message, type, url, title } = payload;

  const headers: Record<string, string> = {
    Title: title,
    Tags: ntfyEmoji[type],
    // 'Priority': '5'
    // TODO: action buttons?
  };
  if (url) headers['Click'] = url;
  if (options?.email) headers['Email'] = options.email;

  //not sure how to do the thumbnail (Attach) field as the docs indicate that might download the file rather than just present it?

  await fetch(topic, {
    method: 'POST',
    body: message,
    headers,
  });
};

const ntfyEmoji: { [key in NotificationType]: string } = {
  viewed: 'eyes',
  downloaded: 'card_file_box',
  rated: 'star',
  flagged: 'triangular_flag_on_post',
  commented: 'left_speech_bubble',
};
