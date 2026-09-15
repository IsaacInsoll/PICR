import { expect, test } from 'vitest';
import type { FolderFields } from '../../backend/db/picrDb.js';
import { hashZipFiles, type ZipSourceFile } from '../../backend/helpers/zip.js';

const folder = { id: 7, name: 'Porsche' } as FolderFields;

const files: ZipSourceFile[] = [
  {
    id: 10,
    fileHash: 'hash-one',
    relativePath: 'Porsche/Social',
    name: 'deliverable.mp4',
    archivePath: 'Social/deliverable.mp4',
  },
  {
    id: 11,
    fileHash: 'hash-two',
    relativePath: 'Porsche/Web',
    name: 'deliverable.mp4',
    archivePath: 'Web/deliverable.mp4',
  },
];

test('ZIP identity includes the canonical selection and relative archive paths', () => {
  const first = hashZipFiles(folder, files, 'selection-one');
  const repeat = hashZipFiles(folder, files, 'selection-one');
  const differentCriteria = hashZipFiles(folder, files, 'selection-two');
  const differentPath = hashZipFiles(
    folder,
    [{ ...files[0], archivePath: 'Elsewhere/deliverable.mp4' }, files[1]],
    'selection-one',
  );

  expect(first.hash).toBe(repeat.hash);
  expect(first.key).toBe(`${folder.id}${first.hash}`);
  expect(first.files.map(({ archivePath }) => archivePath)).toEqual([
    'Social/deliverable.mp4',
    'Web/deliverable.mp4',
  ]);
  expect(differentCriteria.hash).not.toBe(first.hash);
  expect(differentPath.hash).not.toBe(first.hash);
});
