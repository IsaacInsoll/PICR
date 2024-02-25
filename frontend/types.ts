export interface MinimalFolder {
  id: string;
  name?: string;
  parentId?: string | null | undefined;
}

export interface MinimalFile {
  id: string;
  name?: string;
}
