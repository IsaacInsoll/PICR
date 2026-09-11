import {
  defaultMediaFilterCriteria,
  localMetadataFilterKeys,
  normalizeMediaFilterCriteria,
  type FileFlagFilter,
  type LocalMetadataFilterKey,
  type MediaCriteriaCapabilities,
  type MediaFilterCriteria,
  type MediaTypeFilterValue,
  type RatingComparison,
} from '@shared/files/mediaCriteria';

export interface GalleryLocationCriteria {
  mode: 'gallery' | 'results';
  query: string;
  filters: MediaFilterCriteria;
  folderIds: string[];
}

const ownedParameters = [
  'find',
  'q',
  'media',
  'aspect',
  'flag',
  'rating',
  'comments',
  'folder',
  'camera',
  'lens',
  'aperture',
  'shutter',
  'iso',
] as const;

const metadataParameters: Record<
  LocalMetadataFilterKey,
  { parameter: string; kind: 'string' | 'number' }
> = {
  Camera: { parameter: 'camera', kind: 'string' },
  Lens: { parameter: 'lens', kind: 'string' },
  Aperture: { parameter: 'aperture', kind: 'number' },
  ExposureTime: { parameter: 'shutter', kind: 'number' },
  ISO: { parameter: 'iso', kind: 'number' },
};

const mediaTypeParameters: Record<MediaTypeFilterValue, string | null> = {
  All: null,
  Image: 'image',
  Video: 'video',
};

const ratingParameters: Record<RatingComparison, string> = {
  equal: 'eq',
  atLeast: 'gte',
  atMost: 'lte',
};

const parsedSearchParams = (search: string): URLSearchParams =>
  new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

const parseMediaType = (value: string | null): MediaTypeFilterValue => {
  if (value === 'image') return 'Image';
  if (value === 'video') return 'Video';
  return 'All';
};

const parseAspect = (value: string | null): MediaFilterCriteria['aspect'] => {
  if (value === 'landscape' || value === 'square' || value === 'portrait') {
    return value;
  }
  return 'any';
};

const parseFlag = (value: string | null): FileFlagFilter | null => {
  if (value === 'approved' || value === 'rejected' || value === 'none') {
    return value;
  }
  return null;
};

const parseComments = (
  value: string | null,
): MediaFilterCriteria['comments'] => {
  if (value === 'none' || value === 'some') return value;
  return null;
};

const parseRating = (
  value: string | null,
): Pick<MediaFilterCriteria, 'ratingComparison' | 'rating'> => {
  const match = /^(eq|gte|lte):([0-5])$/.exec(value ?? '');
  if (!match) return { ratingComparison: null, rating: 0 };

  const comparisons: Record<string, RatingComparison> = {
    eq: 'equal',
    gte: 'atLeast',
    lte: 'atMost',
  };
  return {
    ratingComparison: comparisons[match[1]],
    rating: Number(match[2]),
  };
};

const parseMetadata = (searchParams: URLSearchParams) => {
  const metadata: MediaFilterCriteria['metadata'] = {};

  for (const key of localMetadataFilterKeys) {
    const { parameter, kind } = metadataParameters[key];
    const values = searchParams
      .getAll(parameter)
      .map((value) => {
        if (kind === 'string') return value || null;
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
      })
      .filter((value): value is string | number => value !== null);
    if (values.length) metadata[key] = values;
  }

  return metadata;
};

export const decodeGalleryLocationCriteria = (
  search: string,
  capabilities: MediaCriteriaCapabilities = { canViewReview: true },
): GalleryLocationCriteria => {
  const searchParams = parsedSearchParams(search);
  const results = searchParams.get('find') === '1';
  const rating = parseRating(searchParams.get('rating'));
  const filters = normalizeMediaFilterCriteria(
    {
      ...defaultMediaFilterCriteria,
      mediaType: parseMediaType(searchParams.get('media')),
      aspect: parseAspect(searchParams.get('aspect')),
      flag: parseFlag(searchParams.get('flag')),
      ...rating,
      comments: parseComments(searchParams.get('comments')),
      metadata: parseMetadata(searchParams),
    },
    capabilities,
  );

  return {
    mode: results ? 'results' : 'gallery',
    query: results ? (searchParams.get('q') ?? '') : '',
    filters,
    folderIds: results
      ? [...new Set(searchParams.getAll('folder').filter(Boolean))]
      : [],
  };
};

export const withGalleryLocationCriteria = (
  currentSearch: string,
  criteria: GalleryLocationCriteria,
  capabilities: MediaCriteriaCapabilities = { canViewReview: true },
): string => {
  const searchParams = parsedSearchParams(currentSearch);
  for (const parameter of ownedParameters) searchParams.delete(parameter);

  const filters = normalizeMediaFilterCriteria(criteria.filters, capabilities);
  if (criteria.mode === 'results') {
    searchParams.set('find', '1');
    if (criteria.query) searchParams.set('q', criteria.query);
    for (const folderId of [...new Set(criteria.folderIds.filter(Boolean))]) {
      searchParams.append('folder', folderId);
    }
  }

  const mediaType = mediaTypeParameters[filters.mediaType];
  if (mediaType) searchParams.set('media', mediaType);
  if (filters.aspect !== 'any') searchParams.set('aspect', filters.aspect);
  if (filters.flag) searchParams.set('flag', filters.flag);
  if (filters.ratingComparison) {
    searchParams.set(
      'rating',
      `${ratingParameters[filters.ratingComparison]}:${filters.rating}`,
    );
  }
  if (filters.comments) searchParams.set('comments', filters.comments);

  for (const key of localMetadataFilterKeys) {
    const parameter = metadataParameters[key].parameter;
    for (const value of filters.metadata[key] ?? []) {
      searchParams.append(parameter, String(value));
    }
  }

  const encoded = searchParams.toString();
  return encoded ? `?${encoded}` : '';
};
