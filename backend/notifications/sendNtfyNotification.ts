import type { NotificationPayload, NotificationType } from './notifications.js';
import { logger } from '../logger.js';

// RFC 2047 limits encoded words to 75 characters. A 45-byte chunk produces at
// most 60 Base64 characters, leaving room for the 12-character wrapper.
const maxEncodedWordBytes = 45;

const encodeWord = (value: string) =>
  `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;

const encodeNtfyHeader = (value: string) => {
  if (/^[\x20-\x7e]*$/.test(value)) return value;

  const encodedWords: string[] = [];
  let chunk = '';

  for (const character of value) {
    if (
      chunk &&
      Buffer.byteLength(chunk + character, 'utf8') > maxEncodedWordBytes
    ) {
      encodedWords.push(encodeWord(chunk));
      chunk = character;
    } else {
      chunk += character;
    }
  }

  if (chunk) encodedWords.push(encodeWord(chunk));
  return encodedWords.join(' ');
};

export const sendNtfyNotification = async (
  topic: string,
  payload: NotificationPayload,
  options?: { email?: string },
) => {
  const { message, type, url, title } = payload;

  const headers: Record<string, string> = {
    Title: encodeNtfyHeader(title),
    Tags: ntfyEmoji[type],
    // 'Priority': '5'
    // TODO: action buttons?
  };
  if (url) headers['Click'] = url;
  if (options?.email) headers['Email'] = options.email;

  //not sure how to do the thumbnail (Attach) field as the docs indicate that might download the file rather than just present it?

  try {
    const response = await fetch(topic, {
      method: 'POST',
      body: message,
      headers,
    });

    if (!response.ok) {
      logger.error(`Ntfy notification failed with HTTP ${response.status}`);
    }
  } catch (error) {
    const errorType = error instanceof Error ? error.name : 'UnknownError';
    logger.error(`Ntfy notification request failed (${errorType})`);
  }
};

const ntfyEmoji: { [key in NotificationType]: string } = {
  viewed: 'eyes',
  downloaded: 'card_file_box',
  rated: 'star',
  flagged: 'triangular_flag_on_post',
  commented: 'left_speech_bubble',
};
