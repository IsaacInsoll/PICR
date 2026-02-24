import type {
  ImageMetadataSummary,
  VideoMetadataSummary,
} from '../gql/graphql.js';

type StripTypename<T> = Omit<T, '__typename'>;

export type PicrMetadataMap = Record<
  string,
  string | number | null | undefined
>;

export type PicrImageMetadata = StripTypename<ImageMetadataSummary>;
export type PicrVideoMetadata = StripTypename<VideoMetadataSummary>;
export type PicrFileMetadata = PicrImageMetadata | PicrVideoMetadata;
