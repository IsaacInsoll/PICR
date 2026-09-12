import { describe, expect, test } from 'vitest';
import {
  capturedAtFromMetadata,
  capturedAtFromValue,
  fileSearchFields,
  serializedMetadataFields,
} from '../../backend/helpers/fileDerivedFields.js';

describe('file derived fields', () => {
  test('normalizes names and paths while retaining their exact sources', () => {
    expect(
      fileSearchFields({
        name: 'Café Élan.JPG',
        relativePath: 'Pörsche/Réseaux Sociaux',
      }),
    ).toEqual({
      normalizedName: 'cafe elan.jpg',
      normalizedNameSource: 'Café Élan.JPG',
      normalizedRelativePath: 'porsche/reseaux sociaux',
      normalizedRelativePathSource: 'Pörsche/Réseaux Sociaux',
    });
  });

  test('normalizes valid capture values and rejects invalid ones', () => {
    const source = new Date('2025-04-03T02:01:00.000Z');
    expect(capturedAtFromValue(source)).toBe(source);
    expect(capturedAtFromValue('2025-04-03T12:01:00+10:00')).toEqual(source);
    expect(capturedAtFromValue('not-a-date')).toBeNull();
    expect(capturedAtFromValue('')).toBeNull();
  });

  test('serializes metadata and derives capturedAt from the same object', () => {
    const metadata = {
      Camera: 'Leica M11',
      DateTimeOriginal: '2025-04-03T12:01:00+10:00',
    };

    expect(capturedAtFromMetadata(metadata)).toEqual(
      new Date('2025-04-03T02:01:00.000Z'),
    );
    expect(serializedMetadataFields(metadata)).toEqual({
      metadata: JSON.stringify(metadata),
      capturedAt: new Date('2025-04-03T02:01:00.000Z'),
    });
  });
});
