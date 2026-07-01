import {
  galleryPasscodeHeader,
  normalizeGalleryPasscode,
} from '@shared/auth/galleryPasscode';

const storageKey = (uuid: string) => `picr:gallery-passcode:${uuid}`;

export const getPublicLinkPasscode = (uuid: string): string | null => {
  if (typeof window === 'undefined') return null;
  return normalizeGalleryPasscode(
    window.sessionStorage.getItem(storageKey(uuid)),
  );
};

export const setPublicLinkPasscode = (uuid: string, passcode: string) => {
  if (typeof window === 'undefined') return;
  const normalized = normalizeGalleryPasscode(passcode);
  if (normalized) {
    window.sessionStorage.setItem(storageKey(uuid), normalized);
  } else {
    window.sessionStorage.removeItem(storageKey(uuid));
  }
};

export const clearPublicLinkPasscode = (uuid: string) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(storageKey(uuid));
};

export const publicLinkPasscodeHeader = galleryPasscodeHeader;
