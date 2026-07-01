export const galleryPasscodeHeader = 'gallery-passcode';

export const normalizeGalleryPasscode = (
  value: string | null | undefined,
): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};
