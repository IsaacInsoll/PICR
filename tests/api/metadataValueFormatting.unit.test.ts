import { describe, expect, it } from 'vitest';
import { formatMetadataValue } from '../../shared/formatMetadataValue';
import { metadataForPresentation } from '../../shared/fileMetadata';

const dimensionsLabel = (locale: string) =>
  metadataForPresentation(
    { metadata: { Width: 6000, Height: 4000 } },
    locale,
  ).find(({ key }) => key === 'Dimensions')?.label;

describe('technical specs are localized but never grouped', () => {
  it('keeps fast shutter denominators ungrouped', () => {
    expect(formatMetadataValue('ExposureTime', 1 / 8000, 'en').label).toBe(
      '¹/8000',
    );
    expect(formatMetadataValue('ExposureTime', 1 / 8000, 'fr').label).toBe(
      '¹/8000',
    );
  });

  it('keeps pixel dimensions ungrouped', () => {
    expect(dimensionsLabel('en')).toBe('6000 × 4000 px');
    expect(dimensionsLabel('fr')).toBe('6000 × 4000 px');
  });

  it('still localizes decimal separators for real quantities', () => {
    expect(formatMetadataValue('Aperture', 2.8, 'en').label).toBe('ƒ2.8');
    expect(formatMetadataValue('Aperture', 2.8, 'fr').label).toBe('ƒ2,8');
  });
});
