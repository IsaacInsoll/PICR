import { expect, test } from 'vitest';
import {
  createTestGraphqlClient,
  getUserHeader,
} from '../../frontend/testGraphqlClient';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { editFolderMutation } from '../../shared/urql/mutations/editFolderMutation';
import { photoFolderId } from './testVariables';

test('Admin can set folder title and subtitle', async () => {
  const headers = await getUserHeader(defaultCredentials);
  const client = await createTestGraphqlClient(headers);

  const updateResult = await client
    .mutation(editFolderMutation, {
      folderId: photoFolderId,
      title: 'Custom Title',
      subtitle: 'Custom Subtitle',
    })
    .toPromise();

  expect(updateResult.error).toBeUndefined();
  expect(updateResult.data?.editFolder?.title).toBe('Custom Title');
  expect(updateResult.data?.editFolder?.subtitle).toBe('Custom Subtitle');

  const clearResult = await client
    .mutation(editFolderMutation, {
      folderId: photoFolderId,
      title: '',
      subtitle: '',
    })
    .toPromise();

  expect(clearResult.error).toBeUndefined();
  expect(clearResult.data?.editFolder?.title).toBeNull();
  expect(clearResult.data?.editFolder?.subtitle).toBeNull();
});
