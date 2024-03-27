import { MetadataSummary } from './src/gql/graphql';
import { FileType } from '../graphql-types';

export interface MinimalFolder {
  id: string;
  name?: string;
  parentId?: string | null | undefined;
  parents?: MinimalFolder[];
}

export interface MinimalFile {
  id: string;
  name?: string;
  fileHash?: string;
  imageRatio?: number | null;
  metadata?: MetadataSummary | null;
  fileSize?: number | null;
  type: FileType;
}
export interface MinimalSharedFolder {
  id: string;
  name?: string;
  uuid?: string;
  enabled?: boolean;
  folder?: MinimalFolder | null;
}
