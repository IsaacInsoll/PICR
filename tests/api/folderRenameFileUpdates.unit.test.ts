import { expect, test } from 'vitest';
import { folderRenamePathPrefixes } from '../../backend/filesystem/folderRenameFileUpdates.js';

test('normalizes rename prefixes without disturbing non-BMP characters', () => {
  expect(folderRenamePathPrefixes('Pörsche/📷 Old', 'Pörsche/📷 New')).toEqual({
    normalizedOldPath: 'porsche/📷 old',
    normalizedNewPath: 'porsche/📷 new',
  });
});
