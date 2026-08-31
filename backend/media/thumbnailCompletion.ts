import { basename } from 'node:path';
import { and, asc, eq, inArray } from 'drizzle-orm';
import type { MediaTypeFilter } from '@shared/gql/graphql.js';
import { thumbnailVariantLadderForSettings } from '@shared/thumbnailVariants.js';
import type { ThumbnailVariant } from '@shared/thumbnailVariants.js';
import type { FolderFields } from '../db/picrDb.js';
import { db } from '../db/picrDb.js';
import { dbFile } from '../db/models/index.js';
import { allSubfolderIds } from '../helpers/allSubfolders.js';
import { getServerMediaSettings } from './serverMediaSettings.js';
import { thumbnailVariantPath } from './thumbnailPath.js';
import { mediaTypesForThumbnailWork } from './mediaTypeFilter.js';
import {
  createThumbnailVariantIndex,
  type ThumbnailVariantIndex,
} from './thumbnailVariants.js';
import {
  videoPosterFramePathForParts,
  videoPosterVariantPathForParts,
  videoScrubPathForParts,
} from './videoThumbnailPaths.js';

export interface ThumbnailCompletion {
  totalFiles: number;
  completeFiles: number;
  incompleteFiles: number;
  totalArtifacts: number;
  missingArtifacts: number;
}

type ThumbnailCompletableFile = Pick<
  typeof dbFile.$inferSelect,
  'fileHash' | 'id' | 'name' | 'relativePath' | 'type'
>;

export const thumbnailCompletionForFolder = async (
  folder: FolderFields,
  mediaType: MediaTypeFilter | null | undefined,
): Promise<ThumbnailCompletion> => {
  const folderIds = await allSubfolderIds(folder);
  const settings = await getServerMediaSettings();
  const variants = thumbnailVariantLadderForSettings(settings);
  const index = createThumbnailVariantIndex();
  const entryNamesByRelativePath = new Map<
    string,
    Promise<ReadonlySet<string>>
  >();

  const files = await db.query.dbFile.findMany({
    columns: {
      id: true,
      name: true,
      relativePath: true,
      fileHash: true,
      type: true,
    },
    where: and(
      inArray(dbFile.folderId, folderIds),
      eq(dbFile.exists, true),
      inArray(dbFile.type, mediaTypesForThumbnailWork(mediaType)),
    ),
    orderBy: asc(dbFile.id),
  });

  const completion: ThumbnailCompletion = {
    totalFiles: 0,
    completeFiles: 0,
    incompleteFiles: 0,
    totalArtifacts: 0,
    missingArtifacts: 0,
  };

  for (const file of files) {
    const expectedArtifacts = expectedThumbnailArtifacts(file, variants);
    const missingArtifacts = await missingThumbnailArtifacts(
      file,
      variants,
      (relativePath) =>
        cacheEntryNames(index, entryNamesByRelativePath, relativePath),
    );
    completion.totalFiles++;
    completion.totalArtifacts += expectedArtifacts;
    completion.missingArtifacts += missingArtifacts;
    if (missingArtifacts === 0) completion.completeFiles++;
    else completion.incompleteFiles++;
  }

  return completion;
};

const cacheEntryNames = (
  index: ThumbnailVariantIndex,
  entryNamesByRelativePath: Map<string, Promise<ReadonlySet<string>>>,
  relativePath: string,
): Promise<ReadonlySet<string>> => {
  let names = entryNamesByRelativePath.get(relativePath);
  if (!names) {
    names = index
      .entries(relativePath)
      .then(
        (entries) =>
          new Set(
            entries
              .filter((entry) => entry.isFile || entry.isDirectory)
              .map((entry) => entry.name),
          ),
      );
    entryNamesByRelativePath.set(relativePath, names);
  }
  return names;
};

const countMissingArtifactNames = (
  existingNames: ReadonlySet<string>,
  expectedNames: readonly string[],
): number =>
  expectedNames.reduce(
    (missing, expectedName) =>
      existingNames.has(expectedName) ? missing : missing + 1,
    0,
  );

const imageThumbnailArtifactNames = (
  file: ThumbnailCompletableFile & { fileHash: string },
  variants: readonly ThumbnailVariant[],
): string[] =>
  variants.map((variant) => basename(thumbnailVariantPath(file, variant)));

const videoBaselineArtifactNames = (
  file: ThumbnailCompletableFile & { fileHash: string },
): string[] => [
  basename(videoScrubPathForParts(file.relativePath, file.name, file.fileHash)),
  basename(
    videoPosterFramePathForParts(file.relativePath, file.name, file.fileHash),
  ),
];

const videoPosterArtifactNames = (
  file: ThumbnailCompletableFile & { fileHash: string },
  variants: readonly ThumbnailVariant[],
): string[] =>
  variants.map((variant) =>
    basename(
      videoPosterVariantPathForParts(
        file.relativePath,
        file.name,
        file.fileHash,
        variant,
      ),
    ),
  );

const expectedThumbnailArtifacts = (
  file: ThumbnailCompletableFile,
  variants: readonly ThumbnailVariant[],
): number => {
  if (file.type === 'Image') return variants.length;
  if (file.type === 'Video') return variants.length + 2;
  return 0;
};

const missingThumbnailArtifacts = async (
  file: ThumbnailCompletableFile,
  variants: readonly ThumbnailVariant[],
  entryNamesForRelativePath: (
    relativePath: string,
  ) => Promise<ReadonlySet<string>>,
): Promise<number> => {
  const fileHash = file.fileHash;
  if (!fileHash) return expectedThumbnailArtifacts(file, variants);
  const fileWithHash = { ...file, fileHash };
  const existingNames = await entryNamesForRelativePath(file.relativePath);

  if (file.type === 'Image') {
    return countMissingArtifactNames(
      existingNames,
      imageThumbnailArtifactNames(fileWithHash, variants),
    );
  }

  if (file.type === 'Video') {
    return countMissingArtifactNames(existingNames, [
      ...videoBaselineArtifactNames(fileWithHash),
      ...videoPosterArtifactNames(fileWithHash, variants),
    ]);
  }

  return 0;
};
