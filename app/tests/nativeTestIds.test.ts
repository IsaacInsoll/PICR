import { describe, expect, it } from '@jest/globals';
import { folderContentsRowTestId } from '@/src/helpers/nativeTestIds';

describe('native test IDs', () => {
  it.each([
    ['Folder', '1', 'folder-row-1'],
    ['Image', '2', 'image-row-2'],
    ['Video', '3', 'video-row-3'],
    ['File', '4', 'file-row-4'],
  ])('builds a stable %s row ID', (__typename, id, expected) => {
    expect(folderContentsRowTestId({ __typename, id })).toBe(expected);
  });
});
