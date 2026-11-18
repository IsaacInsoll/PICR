import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import { readFileSync } from 'node:fs';
import { picrConfig } from '../config/picrConfig.js';
import { log } from '../logger.js';

export const hashAuthToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');
export const randomAuthToken = (): string =>
  randomBytes(32).toString('base64url');

export function configureMfaEncryption(value?: string, file?: string): void {
  if (value && file)
    throw new Error(
      'Specify only one of MFA_ENCRYPTION_KEY and MFA_ENCRYPTION_KEY_FILE',
    );
  let key: string | undefined;
  try {
    key = file ? readFileSync(file, 'utf8').trim() : value?.trim();
  } catch {
    throw new Error('Cannot read MFA_ENCRYPTION_KEY_FILE');
  }
  if (key && !/^[a-f\d]{64}$/i.test(key))
    throw new Error(
      'MFA_ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 random bytes)',
    );
  picrConfig.mfaEncryptionKey = key || undefined;
  if (!key) {
    // A suggestion only: never encrypt data with a key that has not been persisted.
    log(
      'warn',
      `🔐 Optional admin 2FA is unavailable until an encryption key is configured.\nAdd this to your container environment and restart PICR:\n\nMFA_ENCRYPTION_KEY=${randomBytes(32).toString('hex')}\n\nAlternatively, mount a secret file and set MFA_ENCRYPTION_KEY_FILE. Back up the saved key with your database. This suggested key is not active; existing enrolled accounts remain protected.`,
      true,
    );
  }
}

const encryptionKey = (): Buffer => {
  if (!picrConfig.mfaEncryptionKey)
    throw new Error('MFA encryption is not configured');
  return Buffer.from(picrConfig.mfaEncryptionKey, 'hex');
};

export function encryptMfaSecret(secret: string, userId: number): string {
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), nonce);
  cipher.setAAD(Buffer.from(`picr:totp:v1:${userId}`));
  const encrypted = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final(),
  ]);
  return [
    'v1',
    nonce.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

export function decryptMfaSecret(value: string, userId: number): string {
  const [version, nonce, tag, encrypted] = value.split('.');
  if (version !== 'v1' || !nonce || !tag || !encrypted)
    throw new Error('Invalid MFA secret');
  const decipher = createDecipheriv(
    'aes-256-gcm',
    encryptionKey(),
    Buffer.from(nonce, 'base64url'),
  );
  decipher.setAAD(Buffer.from(`picr:totp:v1:${userId}`));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
