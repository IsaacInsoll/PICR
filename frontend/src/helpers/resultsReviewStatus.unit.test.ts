import { describe, expect, it } from 'vitest';
import { FileFlag, FileType } from '@shared/gql/graphql';
import { defaultGalleryFilterCriteria } from '@shared/files/mediaCriteria';
import {
  resultsReviewSnapshot,
  resultsReviewStatus,
} from './resultsReviewStatus';

const file = {
  __typename: 'Image' as const,
  id: '1',
  name: 'Portrait.jpg',
  type: FileType.Image,
  fileHash: 'hash',
  fileSize: '1',
  fileCreated: '2025-01-01T00:00:00.000Z',
  fileLastModified: '2025-01-01T00:00:00.000Z',
  capturedAt: '2025-01-01T00:00:00.000Z',
  flag: FileFlag.Approved,
  rating: 5,
  totalComments: 1,
  latestComment: '2025-01-02T00:00:00.000Z',
  folderId: '2',
  imageWidth: 800,
  imageHeight: 1200,
  imageRatio: 2 / 3,
  blurHash: null,
  metadata: null,
};

const baseline = new Map([['1', resultsReviewSnapshot(file)]]);

describe('resultsReviewStatus', () => {
  it('marks files that stopped matching without removing them', () => {
    expect(
      resultsReviewStatus(
        [{ ...file, flag: FileFlag.Rejected }],
        baseline,
        { ...defaultGalleryFilterCriteria, flag: 'approved' },
        { type: 'Filename', direction: 'Asc', foldersFirst: true },
      ),
    ).toEqual({ noLongerMatch: 1, sortChanged: 0 });
  });

  it('only marks review changes that affect the active sort', () => {
    expect(
      resultsReviewStatus(
        [{ ...file, rating: 4 }],
        baseline,
        defaultGalleryFilterCriteria,
        { type: 'Rating', direction: 'Desc', foldersFirst: true },
      ),
    ).toEqual({ noLongerMatch: 0, sortChanged: 1 });
    expect(
      resultsReviewStatus(
        [{ ...file, flag: FileFlag.Rejected }],
        baseline,
        defaultGalleryFilterCriteria,
        { type: 'Filename', direction: 'Asc', foldersFirst: true },
      ),
    ).toEqual({ noLongerMatch: 0, sortChanged: 0 });
  });

  it('treats every review mutation as changing recently-commented order', () => {
    expect(
      resultsReviewStatus(
        [{ ...file, totalComments: 2 }],
        baseline,
        defaultGalleryFilterCriteria,
        { type: 'RecentlyCommented', direction: 'Desc', foldersFirst: true },
      ),
    ).toEqual({ noLongerMatch: 0, sortChanged: 1 });
  });
});
