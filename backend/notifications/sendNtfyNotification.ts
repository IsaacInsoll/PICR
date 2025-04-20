import { NotificationPayload, NotificationType } from './notifications';

export const sendNtfyNotification = async (
  topic: string,
  payload: NotificationPayload,
) => {
  const { message, type } = payload;

  await fetch(topic, {
    method: 'POST',
    body: message,
    headers: {
      Title: 'PICR',
      Tags: ntfyEmoji[type],
      // 'Priority': '5'
      //'Click': 'https://www.reddit.com/message/messages'
      // TODO: action buttons?
    },
  });
};

const ntfyEmoji: { [key in NotificationType]: string } = {
  View: 'eyes',
  Download: 'star',
  // | 'triangular_flag_on_post'
  // | 'left_speech_bubble'
  // | 'card_file_box';
};
