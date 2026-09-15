import { filterFiles } from '@shared/files/filterFiles';
import type { GalleryFilterCriteria } from '@shared/files/mediaCriteria';
import type { FileSort } from '@shared/files/sortFiles';
import type { PicrFile } from '@shared/types/picr';

export interface ResultsReviewStatus {
  noLongerMatch: number;
  sortChanged: number;
}

export interface ResultsReviewSnapshot {
  flag: PicrFile['flag'];
  latestComment: PicrFile['latestComment'];
  rating: PicrFile['rating'];
  totalComments: PicrFile['totalComments'];
}

type ResultsReviewFile = PicrFile & { __typename: string };

export const resultsReviewSnapshot = (
  file: PicrFile,
): ResultsReviewSnapshot => ({
  flag: file.flag,
  latestComment: file.latestComment,
  rating: file.rating,
  totalComments: file.totalComments,
});

export const resultsReviewStatus = (
  files: readonly ResultsReviewFile[],
  baseline: ReadonlyMap<string, ResultsReviewSnapshot>,
  filters: GalleryFilterCriteria,
  sort: FileSort,
): ResultsReviewStatus => {
  let noLongerMatch = 0;
  let sortChanged = 0;
  const recursiveFilters = { ...filters, metadata: {} };

  for (const file of files) {
    const original = baseline.get(file.id);
    if (!original) continue;
    const ratingChanged = original.rating !== file.rating;
    const flagChanged = original.flag !== file.flag;
    const commentsChanged =
      original.totalComments !== file.totalComments ||
      original.latestComment !== file.latestComment;
    if (!ratingChanged && !flagChanged && !commentsChanged) continue;

    if (filterFiles([file], recursiveFilters).length === 0) {
      noLongerMatch += 1;
      continue;
    }

    if (
      (sort.type === 'Rating' && ratingChanged) ||
      (sort.type === 'RecentlyCommented' &&
        (ratingChanged || flagChanged || commentsChanged))
    ) {
      sortChanged += 1;
    }
  }

  return { noLongerMatch, sortChanged };
};
