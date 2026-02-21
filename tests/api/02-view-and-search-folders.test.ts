import { expect, test } from 'vitest';
import {
  createTestGraphqlClient,
  getUserHeader,
} from '../../frontend/testGraphqlClient';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { viewFolderQuery } from '../../shared/urql/queries/viewFolderQuery';
import { searchQuery } from '../../shared/urql/queries/searchQuery';
import { folderFilesQuery } from '../../shared/urql/queries/folderFilesQuery';

test('View Home Folder', async () => {
  const headers = await getUserHeader(defaultCredentials);
  const client = await createTestGraphqlClient(headers);
  const result = await client
    .query(viewFolderQuery, { folderId: '1' })
    .toPromise();
  expect(result.error).toBeUndefined();
  expect(result.data?.folder).toBeDefined();
  const folder = result.data!.folder;

  expect(folder.id).toBe('1');
  expect(folder.name).toBe('Home');
  expect(folder.parentId).toBe(null);
  expect(folder.permissions).toBe('Admin');

  expect(folder.branding).toBeDefined();
  expect(folder.branding?.mode).toBe('auto');
  expect(folder.branding?.primaryColor).toBe('blue');

  expect(folder.heroImage).toBeDefined();
  expect(folder.heroImage?.id).toBe('2');
  expect(folder.heroImage?.name.endsWith('.jpg')).toBe(true);
  expect(folder.heroImage?.fileHash).toHaveLength(64);
  expect(folder.heroImage?.blurHash.length).toBeGreaterThan(20);
  expect(folder.heroImage?.blurHash.length).toBeLessThan(50);

  expect(folder.subFolders.length).toBe(2);
  expect(folder.files.length).toBe(0);

  //TODO: more subFolder tests like parentId, heroImage, users, name
});

test('Admin Search Files and Folders', async () => {
  const headers = await getUserHeader(defaultCredentials);
  const client = await createTestGraphqlClient(headers);
  const result = await client
    .query(searchQuery, { folderId: '1', query: 'Birthday' })
    .toPromise();

  expect(result.error).toBeUndefined();
  expect(result.data?.searchFolders).toBeDefined();
  expect(result.data?.searchFiles).toBeDefined();

  const { searchFolders, searchFiles } = result.data!;

  expect(searchFolders).toHaveLength(1);
  const folder = searchFolders[0];
  expect(folder.name).toContain('Birthday');
  expect(folder.id).toBeTruthy();

  expect(searchFiles).toHaveLength(1);
  const file = searchFiles[0];
  expect(file.name).toContain('Birthday');
  expect(file.id).toBeTruthy();
  expect(file.folderId).toBe(folder.id);
});

test('Folder files export includes relative paths', async () => {
  const headers = await getUserHeader(defaultCredentials);
  const client = await createTestGraphqlClient(headers);
  const result = await client
    .query(folderFilesQuery, {
      folderId: '1',
      includeSubfolders: true,
      limit: 1,
    })
    .toPromise();

  expect(result.error).toBeUndefined();
  expect(result.data?.folderFiles).toBeDefined();
  const folderFiles = result.data!.folderFiles;

  expect(folderFiles.totalReturned).toBeLessThanOrEqual(1);
  expect(folderFiles.totalAvailable).toBeGreaterThanOrEqual(
    folderFiles.totalReturned,
  );
  expect(folderFiles.truncated).toBe(
    folderFiles.totalAvailable > folderFiles.totalReturned,
  );

  if (folderFiles.files.length > 0) {
    const item = folderFiles.files[0];
    expect(item.relativePath).toBeTruthy();
    expect(item.relativePath.endsWith(item.file.name)).toBe(true);
  }
});
