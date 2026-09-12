import { normalizeSearchText } from '@shared/files/mediaCriteria.js';

interface FileIdentityFields {
  name: string;
  relativePath: string;
}

interface CaptureMetadata {
  DateTimeOriginal?: unknown;
}

export interface FileSearchFields {
  normalizedName: string;
  normalizedNameSource: string;
  normalizedRelativePath: string;
  normalizedRelativePathSource: string;
}

interface SerializedMetadataFields {
  metadata: string;
  capturedAt: Date | null;
}

export const fileSearchFields = ({
  name,
  relativePath,
}: FileIdentityFields): FileSearchFields => ({
  normalizedName: normalizeSearchText(name),
  normalizedNameSource: name,
  normalizedRelativePath: normalizeSearchText(relativePath),
  normalizedRelativePathSource: relativePath,
});

const captureMetadata = (metadata: unknown): CaptureMetadata | null =>
  typeof metadata === 'object' && metadata !== null
    ? (metadata as CaptureMetadata)
    : null;

export const capturedAtFromValue = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null;
  }
  if (typeof value !== 'string' || value.trim() === '') return null;

  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
};

export const capturedAtFromMetadata = (metadata: unknown): Date | null =>
  capturedAtFromValue(captureMetadata(metadata)?.DateTimeOriginal);

export const serializedMetadataFields = (
  metadata: object,
): SerializedMetadataFields => ({
  metadata: JSON.stringify(metadata),
  capturedAt: capturedAtFromMetadata(metadata),
});
