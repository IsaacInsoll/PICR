import { atom, useAtomValue } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const authKeyAtom = atomWithStorage('authKey', '', undefined, {
  getOnInit: true,
});

const createFallbackSessionKey = () => {
  const browserCrypto: Partial<Crypto> = globalThis.crypto;
  const bytes = new Uint8Array(16);
  if (typeof browserCrypto.getRandomValues === 'function') {
    browserCrypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
};

const createSessionKey = () => {
  const browserCrypto: Partial<Crypto> = globalThis.crypto;
  if (typeof browserCrypto.randomUUID === 'function') {
    return browserCrypto.randomUUID();
  }

  return createFallbackSessionKey();
};

const sessionKeyAtom = atom<string>(createSessionKey());

export const useSessionKey = () => {
  return useAtomValue(sessionKeyAtom);
};
