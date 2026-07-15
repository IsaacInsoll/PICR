import type { FilterOptionsInterface } from '@shared/filterAtom';
import type { ViewFolderQuery } from '@shared/gql/graphql';
import { DefaultFilterOptions, filterFiles } from './filterFiles';

export type FileSortType =
  | 'Filename'
  | 'LastModified'
  | 'DateTaken'
  | 'RecentlyCommented'
  | 'Rating';
export type FileSortDirection = 'Asc' | 'Desc';

export interface FileSort {
  type: FileSortType;
  direction: FileSortDirection;
  // When false, folders are interleaved with files by the active sort instead of
  // being grouped first. Optional/undefined is treated as `true` (the default and
  // historical behavior) so existing FileSort values and encoded strings still work.
  foldersFirst?: boolean;
}

export const defaultFileSort: FileSort = {
  type: 'Filename',
  direction: 'Asc',
  foldersFirst: true,
};

// Compact encoding used by the URL hash, the app, and Branding.defaultFileSort.
// `<typeChar>` plus an optional `a` suffix for ascending (descending omits it),
// plus an optional `i` suffix ("interleaved") when folders are NOT grouped first.
// The `i` is only emitted for the non-default case, so every string produced
// before folders-first existed stays byte-for-byte identical.
const fileSortEncoding: { [key in FileSortType]: string } = {
  Filename: 'f',
  LastModified: 'm',
  DateTaken: 't',
  RecentlyCommented: 'c',
  Rating: 'r',
};

const foldersFirstOff = 'i';

export const encodeFileSort = (sort: FileSort): string =>
  fileSortEncoding[sort.type] +
  (sort.direction === 'Asc' ? 'a' : '') +
  (sort.foldersFirst === false ? foldersFirstOff : '');

// Natural default direction when a sort type is freshly selected. Filename
// reads A→Z and Date taken reads oldest→newest (a timeline); date/score sorts
// default to newest/highest first.
const defaultDirectionByType: Record<FileSortType, FileSortDirection> = {
  Filename: 'Asc',
  DateTaken: 'Asc',
  LastModified: 'Desc',
  RecentlyCommented: 'Desc',
  Rating: 'Desc',
};

export const defaultSortDirection = (type: FileSortType): FileSortDirection =>
  defaultDirectionByType[type];

export const decodeFileSort = (
  encoded: string | null | undefined,
): FileSort => {
  if (!encoded) return defaultFileSort;
  const typeEntry = Object.entries(fileSortEncoding).find(
    ([, v]) => v === encoded[0],
  );
  if (!typeEntry) return defaultFileSort;
  // Parse positionally: "<typeChar>" then optional "a" (Asc) then optional "i"
  // (folders NOT first). A missing "i" means foldersFirst=true, so older strings
  // like "f"/"fa"/"m" and Branding.defaultFileSort values upgrade gracefully.
  // Any leftover characters are treated as garbage and revert to the default
  // rather than silently inferring an odd sort.
  let rest = encoded.slice(1);
  let direction: FileSortDirection = 'Desc';
  if (rest[0] === 'a') {
    direction = 'Asc';
    rest = rest.slice(1);
  }
  let foldersFirst = true;
  if (rest[0] === foldersFirstOff) {
    foldersFirst = false;
    rest = rest.slice(1);
  }
  if (rest.length > 0) return defaultFileSort;
  const type = typeEntry[0] as FileSortType;
  return { type, direction, foldersFirst };
};

// The type of sort actually applied to subfolders (which have no rating,
// comments or capture date). Mirrors the folderSort mapping in
// sortFolderContents: date-ish sorts collapse to LastModified, everything else
// to Filename.
const folderEffectiveType = (type: FileSortType): FileSortType =>
  type === 'LastModified' || type === 'DateTaken' ? 'LastModified' : 'Filename';

// Normalizes a stored/URL sort to what the current folder can actually honor, so
// the selector display and the real ordering stay in agreement:
//  - Folders-only view (no files): file-only sorts (Rating/Commented/DateTaken)
//    have nothing to act on, so collapse to the folder-applicable equivalent.
//  - "Date taken" only makes sense with EXIF capture dates; without them it falls
//    back to LastModified.
export const resolveEffectiveSort = (
  sort: FileSort,
  hasCaptureDates: boolean,
  hasFiles: boolean = true,
): FileSort => {
  if (!hasFiles) {
    return { ...sort, type: folderEffectiveType(sort.type) };
  }
  return sort.type === 'DateTaken' && !hasCaptureDates
    ? { ...sort, type: 'LastModified' }
    : sort;
};

type SortableItem = {
  __typename?: string;
  name?: string | null;
  fileLastModified?: string | null;
  folderLastModified?: string | null;
  latestComment?: string | null;
  rating?: number | null;
  // Index signature lets video/other metadata shapes (which lack
  // DateTimeOriginal) still satisfy this structural type.
  metadata?: {
    DateTimeOriginal?: string | null;
    [key: string]: unknown;
  } | null;
};

const compareNames = (
  aName: string | null | undefined,
  bName: string | null | undefined,
  direction: FileSortDirection,
) => {
  const positive = direction === 'Asc' ? 1 : -1;
  const a = aName ?? '';
  const b = bName ?? '';
  if (a < b) return -positive;
  if (a > b) return positive;
  return 0;
};

const compareDates = (
  aDate: string | null | undefined,
  bDate: string | null | undefined,
  direction: FileSortDirection,
) => {
  if (!aDate && !bDate) return 0;
  if (!aDate) return 1;
  if (!bDate) return -1;
  const positive = direction === 'Asc' ? 1 : -1;
  if (aDate < bDate) return -positive;
  if (aDate > bDate) return positive;
  return 0;
};

const lastModifiedFor = (item: SortableItem) =>
  item.fileLastModified ?? item.folderLastModified ?? null;

// EXIF capture time, gracefully falling back to file-modified for videos,
// text notes and EXIF-less images.
const dateTakenFor = (item: SortableItem) =>
  item.metadata?.DateTimeOriginal ??
  item.fileLastModified ??
  item.folderLastModified ??
  null;

export const sortFiles = <T extends SortableItem>(
  items: T[],
  sort: FileSort,
): T[] => {
  const { type, direction } = sort;
  const positive = direction === 'Asc' ? 1 : -1;
  if (type === 'Filename') {
    return [...items].sort((a, b) => compareNames(a.name, b.name, direction));
  }
  if (type === 'LastModified') {
    return [...items].sort((a, b) =>
      compareDates(lastModifiedFor(a), lastModifiedFor(b), direction),
    );
  }
  if (type === 'DateTaken') {
    return [...items].sort((a, b) =>
      compareDates(dateTakenFor(a), dateTakenFor(b), direction),
    );
  }
  if (type === 'RecentlyCommented') {
    return [...items].sort((a, b) =>
      compareDates(a.latestComment, b.latestComment, direction),
    );
  }
  return [...items].sort((a, b) => {
    const ar = a.rating ?? 0;
    const br = b.rating ?? 0;
    if (ar < br) return -positive;
    if (ar > br) return positive;
    return 0;
  });
};

export type ViewFolder = ViewFolderQuery['folder'];
export type ViewFolderFile = ViewFolder['files'][number];
export type ViewFolderSubFolder = ViewFolder['subFolders'][number];
export type ViewFolderFileWithHero = ViewFolderFile & {
  isHeroImage?: boolean;
  isBannerImage?: boolean;
};

export interface SortFolderContentsOptions {
  sort: FileSort;
  filtering?: boolean;
  filters?: FilterOptionsInterface;
  heroImageId?: string | null;
  foldersFirst?: boolean;
}

export interface SortFolderContentsResult {
  folder: ViewFolder;
  files: ViewFolderFileWithHero[];
  folders: ViewFolderSubFolder[];
  items: (ViewFolderSubFolder | ViewFolderFileWithHero)[];
}

const withHeroImageFlag = (
  files: ViewFolderFile[],
  heroImageId?: string | null,
  bannerImageId?: string | null,
): ViewFolderFileWithHero[] =>
  files.map((file) => ({
    ...file,
    isHeroImage: !!heroImageId && file.id === heroImageId,
    isBannerImage: !!bannerImageId && file.id === bannerImageId,
  }));

export const sortFolderContents = (
  folder: ViewFolder,
  {
    sort,
    filtering = false,
    filters = DefaultFilterOptions,
    heroImageId,
    foldersFirst = true,
  }: SortFolderContentsOptions,
): SortFolderContentsResult => {
  const filteredFiles = filtering
    ? filterFiles(folder.files, filters)
    : folder.files;
  const sortedFiles = sortFiles(filteredFiles, sort);
  // Folders have no capture date, so order Date-taken galleries by folder
  // recency (same as LastModified) rather than by name.
  const folderSort: FileSort =
    sort.type === 'LastModified' || sort.type === 'DateTaken'
      ? { type: 'LastModified', direction: sort.direction }
      : { type: 'Filename', direction: sort.direction };
  const sortedFolders = sortFiles(folder.subFolders, folderSort);
  const filesWithHero = withHeroImageFlag(
    sortedFiles,
    heroImageId ?? folder.heroImage?.id,
    folder.bannerImage?.id,
  );
  // foldersFirst groups all folders ahead of all files (the default). When off,
  // folders and files are interleaved into one list sorted together by the same
  // key. For file-only sorts (Rating/Commented/DateTaken) folders lack the field
  // and fall back per sortFiles, so they naturally settle at one end.
  const items = foldersFirst
    ? [...sortedFolders, ...filesWithHero]
    : sortFiles([...sortedFolders, ...filesWithHero], sort);
  const sortedFolder = {
    ...folder,
    subFolders: sortedFolders,
    files: filesWithHero,
  };
  return {
    folder: sortedFolder,
    files: filesWithHero,
    folders: sortedFolders,
    items,
  };
};
