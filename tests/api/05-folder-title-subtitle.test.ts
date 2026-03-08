import { expect, test } from 'vitest';
import { createTestGraphqlClient, getUserHeader } from './testGraphqlClient';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { editFolderMutation } from '../../shared/urql/mutations/editFolderMutation';
import { viewFolderQuery } from '../../shared/urql/queries/viewFolderQuery';
import { AUTH_REASON } from '../../shared/auth/authErrorContract';
import { photoFolderId, videoFolderId } from './testVariables';

const expectAuthCode = (
  result: { error?: { graphQLErrors?: Array<{ extensions?: unknown }> } },
  code: 'UNAUTHENTICATED' | 'FORBIDDEN' | 'BAD_USER_INPUT',
  reason: string,
) => {
  expect(result.error).toBeDefined();
  const actualCode = (
    result.error?.graphQLErrors?.[0]?.extensions as
      | { code?: string; reason?: string }
      | undefined
  )?.code;
  const actualReason = (
    result.error?.graphQLErrors?.[0]?.extensions as
      | { code?: string; reason?: string }
      | undefined
  )?.reason;
  expect(actualCode).toBe(code);
  expect(actualReason).toBe(reason);
};

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

test('Admin can set and clear banner image, and invalid cases are rejected', async () => {
  const headers = await getUserHeader(defaultCredentials);
  const client = await createTestGraphqlClient(headers);

  const photoFolder = await client
    .query(viewFolderQuery, { folderId: photoFolderId })
    .toPromise();
  expect(photoFolder.error).toBeUndefined();
  const imageInPhotoFolder = photoFolder.data?.folder?.files?.find(
    (f) => f.__typename === 'Image',
  );
  expect(imageInPhotoFolder?.id).toBeDefined();

  const setBanner = await client
    .mutation(editFolderMutation, {
      folderId: photoFolderId,
      bannerImageId: imageInPhotoFolder?.id,
    })
    .toPromise();
  expect(setBanner.error).toBeUndefined();
  expect(setBanner.data?.editFolder?.bannerImage?.id).toBe(imageInPhotoFolder?.id);

  const clearBanner = await client
    .mutation(editFolderMutation, {
      folderId: photoFolderId,
      bannerImageId: null,
    })
    .toPromise();
  expect(clearBanner.error).toBeUndefined();
  expect(clearBanner.data?.editFolder?.bannerImage?.id).toBeUndefined();

  const invalidId = await client
    .mutation(editFolderMutation, {
      folderId: photoFolderId,
      bannerImageId: '99999999',
    })
    .toPromise();
  expectAuthCode(invalidId, 'BAD_USER_INPUT', AUTH_REASON.INVALID_BANNER_IMAGE);

  const videoFolder = await client
    .query(viewFolderQuery, { folderId: videoFolderId })
    .toPromise();
  expect(videoFolder.error).toBeUndefined();
  const nonImageInVideoFolder = videoFolder.data?.folder?.files?.find(
    (f) => f.__typename !== 'Image',
  );
  expect(nonImageInVideoFolder?.id).toBeDefined();

  const invalidType = await client
    .mutation(editFolderMutation, {
      folderId: videoFolderId,
      bannerImageId: nonImageInVideoFolder?.id,
    })
    .toPromise();
  expectAuthCode(
    invalidType,
    'BAD_USER_INPUT',
    AUTH_REASON.INVALID_BANNER_IMAGE_TYPE,
  );

  const outOfScope = await client
    .mutation(editFolderMutation, {
      folderId: videoFolderId,
      bannerImageId: imageInPhotoFolder?.id,
    })
    .toPromise();
  expectAuthCode(
    outOfScope,
    'BAD_USER_INPUT',
    AUTH_REASON.BANNER_IMAGE_OUT_OF_SCOPE,
  );
});
