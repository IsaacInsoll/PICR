import { MetadataSummary } from './src/gql/graphql';

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
}
export interface MinimalSharedFolder {
  id: string;
  name?: string;
  uuid?: string;
  enabled?: boolean;
  folder?: MinimalFolder | null;
}
