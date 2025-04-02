import { expect, test } from 'vitest';
import {
  createTestGraphqlClient,
  getUserHeader,
} from '../frontend/testGraphqlClient';
import { defaultCredentials } from '../backend/auth/defaultCredentials';
import { editUserMutation } from '../frontend/src/urql/mutations/editUserMutation';

import { gravatarTest, photoFolderId, testPublicLink } from './testVariables';

test('Public Link', async () => {
  const headers = await getUserHeader(defaultCredentials);
  const client = await createTestGraphqlClient(headers);

  const result = await client
    .mutation(editUserMutation, testPublicLink)
    .toPromise();

  expect(result.error).toBeUndefined();
  expect(result.data?.editUser).toBeDefined();

  const user = result.data!.editUser;
  //exclude folder prop, test it separately
  expect({ ...user, folder: undefined }).toEqual({
    ...testPublicLink,
    id: '2',
    gravatar: gravatarTest.result,
  });

  const folder = user.folder;
  expect(folder?.id).toBe(photoFolderId);
  expect(folder?.parents).toHaveLength(1);
  expect(folder?.parents[0].id).toBe('1');
});

//TODO: can view current folder
//TODO: can't view parent folder
//TODO: can't view non-existent folder
//TODO: can view comments
//TODO: can't add comment
