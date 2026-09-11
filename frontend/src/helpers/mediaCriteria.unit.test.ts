import { describe, expect, test } from 'vitest';
import {
  defaultMediaFilterCriteria,
  mediaCriteriaEqual,
  mediaCriteriaFingerprint,
  mediaTypeFilterValues,
  normalizeMediaFilterCriteria,
} from '@shared/files/mediaCriteria';
import { MediaTypeFilter } from '@shared/gql/graphql';

describe('media criteria', () => {
  test('uses the existing GraphQL media type values', () => {
    expect(mediaTypeFilterValues).toEqual(Object.values(MediaTypeFilter));
  });

  test('normalizes values into a stable fingerprint', () => {
    const left = {
      ...defaultMediaFilterCriteria,
      metadata: { ISO: [400, 100, 400], Camera: ['Canon'] },
    };
    const right = {
      ...defaultMediaFilterCriteria,
      metadata: { Camera: ['Canon'], ISO: [100, 400] },
    };

    expect(mediaCriteriaEqual(left, right)).toBe(true);
    expect(mediaCriteriaFingerprint(left)).toBe(
      mediaCriteriaFingerprint(right),
    );
  });

  test('normalizes invalid and unauthorized review values', () => {
    expect(
      normalizeMediaFilterCriteria(
        {
          ratingComparison: 'atLeast',
          rating: 99,
          flag: 'approved',
          comments: 'some',
        },
        { canViewReview: false },
      ),
    ).toEqual(defaultMediaFilterCriteria);
  });
});
