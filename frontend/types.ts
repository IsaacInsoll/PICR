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
  title?: string | null;
  subtitle?: string | null;
  parentId?: string | null | undefined;
  parents?: MinimalFolder[];
  relativePath?: string;
  folderLastModified?: string;
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
  isHeroImage?: boolean;
}
export interface MinimalSharedFolder {
  id?: string;
  name?: string;
  username?: string;
  gravatar?: string;
  commentPermissions?: CommentPermissions;
  uuid?: string;
  ntfy?: string;
  ntfyEmail?: boolean;
  enabled?: boolean;
  folder?: MinimalFolder | null;
}
