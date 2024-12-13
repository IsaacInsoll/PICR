import {
  CommentPermissions,
  FileFlag,
  FileType,
  ImageMetadataSummary,
  VideoMetadataSummary,
} from '../graphql-types';

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
  imageRatio?: number | null;
  duration?: number | null;
  metadata?: ImageMetadataSummary | VideoMetadataSummary | null;
  fileSize?: number | null;
  type: FileType;
  flag: FileFlag | null;
  rating: number | null;
  totalComments: number | null;
}
export interface MinimalSharedFolder {
  id?: string;
  name?: string;
  username?: string;
  gravatar?: string;
  commentPermissions?: CommentPermissions;
  uuid?: string;
  enabled?: boolean;
  folder?: MinimalFolder | null;
}
