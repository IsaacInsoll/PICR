import { createHash, createHmac, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { picrConfig } from '../config/picrConfig.js';
import type { AuthorizedMediaResultsSelection } from './mediaResultsSelection.js';

export type MediaTextExportFormat = 'picr' | 'comma' | 'space';

export interface MediaTextExportFile {
  name: string;
  relativePath: string;
  rating: number;
  flag: string | null;
}

const safeFileName = (value: string) =>
  value.replace(/[^\p{L}\p{N}_.-]+/gu, '_') || 'folder';

const stripExtension = (value: string) => {
  const lastSlash = value.lastIndexOf('/');
  const prefix = lastSlash >= 0 ? value.slice(0, lastSlash + 1) : '';
  const name = lastSlash >= 0 ? value.slice(lastSlash + 1) : value;
  return prefix + name.replace(/\.[^.]+$/, '');
};

const csvValue = (value: string | number) => {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export const formatMediaTextExport = (
  files: readonly MediaTextExportFile[],
  format: MediaTextExportFormat,
  excludeExtensions: boolean,
) => {
  const names = files.map(({ name, relativePath }) => {
    const value = relativePath ? `${relativePath}/${name}` : name;
    return excludeExtensions ? stripExtension(value) : value;
  });
  if (format === 'comma') return names.join(',');
  if (format === 'space') return names.join(' ');
  return files
    .map((file, index) =>
      [
        csvValue(names[index] ?? ''),
        csvValue(file.rating),
        csvValue(
          file.flag === 'approved' || file.flag === 'rejected' ? file.flag : '',
        ),
      ].join(','),
    )
    .join('\n');
};

const exportPathFor = (folderId: number, token: string) =>
  path.join(picrConfig.cachePath, 'exports', String(folderId), token);

export const validMediaExportToken = (token: string) =>
  /^[a-f0-9]{64}$/.test(token);

export const mediaExportPath = (folderId: number, token: string) =>
  validMediaExportToken(token) ? exportPathFor(folderId, token) : null;

export const generateMediaTextExport = async ({
  selection,
  format,
  excludeExtensions,
}: {
  selection: AuthorizedMediaResultsSelection;
  format: MediaTextExportFormat;
  excludeExtensions: boolean;
}) => {
  const selectedFiles = await selection.filesForExport();
  const content = formatMediaTextExport(
    selectedFiles.map(({ file, relativePath }) => ({
      name: file.name,
      relativePath,
      rating: file.rating,
      flag: file.flag,
    })),
    format,
    excludeExtensions,
  );
  const extension = format === 'picr' ? 'csv' : 'txt';
  const filename = `${safeFileName(selection.rootFolder.name)}-export.${extension}`;
  const contentHash = createHash('sha256').update(content).digest('hex');
  const secret = picrConfig.tokenSecret;
  if (!secret) throw new Error('Token secret is not initialized');
  const token = createHmac('sha256', secret)
    .update(
      JSON.stringify({
        folderId: selection.rootFolder.id,
        selection: selection.selectionFingerprint,
        format,
        excludeExtensions,
        contentHash,
      }),
    )
    .digest('hex');
  const outputPath = exportPathFor(selection.rootFolder.id, token);
  if (!existsSync(outputPath)) {
    await mkdir(path.dirname(outputPath), { recursive: true });
    const partialPath = `${outputPath}.${randomUUID()}.partial`;
    try {
      await writeFile(partialPath, content, 'utf8');
      try {
        await rename(partialPath, outputPath);
      } catch (error) {
        // Concurrent identical requests may publish the same immutable content
        // first. Windows does not replace an existing destination atomically;
        // accepting that completed artifact is safe because the token includes
        // the content hash.
        if (!existsSync(outputPath)) throw error;
      }
    } finally {
      await rm(partialPath, { force: true });
    }
  }
  return {
    token,
    count: selectedFiles.length,
    filename,
  };
};
