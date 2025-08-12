import {
  CommentPermissions,
  FileFlag,
  FileType,
  ImageMetadataSummary,
  VideoMetadataSummary,
} from '../graphql-types.js';

// August 2025:
// These should not be used and should be replaced with Partial<GraphQLType> types as this is an unnecessary complication

export interface MinimalFolder {
  id: string;
  name?: string;
  parentId?: string | null | undefined;
  parents?: MinimalFolder[];
}

export interface MinimalFile {
  id: string;
  name?: string;
  fileLastModified: string;
  fileHash?: string;
  blurHash?: string;
  imageRatio?: number | null;
  duration?: number | null;
  metadata?: ImageMetadataSummary | VideoMetadataSummary | null;
  fileSize?: number | null;
  type: FileType;
  flag?: FileFlag | null;
  rating?: number | null;
  totalComments: number | null;
}
export interface MinimalSharedFolder {
  id?: string;
  name?: string;
  username?: string;
  gravatar?: string;
  commentPermissions?: CommentPermissions;
  uuid?: string;
  ntfy?: string;
  enabled?: boolean;
  folder?: MinimalFolder | null;
}
