import { describe, expect, test } from 'vitest';
import { defaultMediaFilterCriteria } from '@shared/files/mediaCriteria';
import {
  decodeGalleryLocationCriteria,
  withGalleryLocationCriteria,
} from './galleryCriteriaSearchParams';

describe('gallery criteria search parameters', () => {
  test('round trips Results criteria and preserves unrelated parameters', () => {
    const search = withGalleryLocationCriteria(
      '?link=12',
      {
        mode: 'results',
        query: 'social vertical',
        folderIds: ['8', '9', '8'],
        filters: {
          mediaType: 'Video',
          aspect: 'portrait',
          flag: 'approved',
          ratingComparison: 'atLeast',
          rating: 5,
          comments: 'some',
          metadata: {
            Camera: ['Canon EOS R5'],
            Aperture: [2.8],
            ISO: [100, 400],
          },
        },
      },
      { canViewReview: true },
    );

    expect(search).toContain('link=12');
    expect(decodeGalleryLocationCriteria(search)).toEqual({
      mode: 'results',
      query: 'social vertical',
      folderIds: ['8', '9'],
      filters: {
        mediaType: 'Video',
        aspect: 'portrait',
        flag: 'approved',
        ratingComparison: 'atLeast',
        rating: 5,
        comments: 'some',
        metadata: {
          Camera: ['Canon EOS R5'],
          Aperture: [2.8],
          ISO: [100, 400],
        },
      },
    });
  });

  test('omits defaults and clears stale owned parameters', () => {
    expect(
      withGalleryLocationCriteria(
        '?link=12&find=1&q=old&media=video&folder=8',
        {
          mode: 'gallery',
          query: '',
          folderIds: [],
          filters: defaultMediaFilterCriteria,
        },
      ),
    ).toBe('?link=12');
  });

  test('drops review criteria when review state is unavailable', () => {
    const capabilities = { canViewReview: false };
    const decoded = decodeGalleryLocationCriteria(
      '?flag=approved&rating=gte:5&comments=some&media=image',
      capabilities,
    );

    expect(decoded.filters).toEqual({
      ...defaultMediaFilterCriteria,
      mediaType: 'Image',
    });
    expect(
      withGalleryLocationCriteria(
        '?link=12&flag=approved&rating=gte:5&comments=some',
        decoded,
        capabilities,
      ),
    ).toBe('?link=12&media=image');
  });

  test('uses safe defaults for malformed values', () => {
    expect(
      decodeGalleryLocationCriteria(
        '?find=no&q=ignored&media=audio&aspect=wide&rating=gt:99&iso=nope&folder=',
      ),
    ).toEqual({
      mode: 'gallery',
      query: '',
      folderIds: [],
      filters: defaultMediaFilterCriteria,
    });
  });
});
