import { expect, test } from 'vitest';
import { getUserHeader } from '../frontend/testGraphqlClient';
import { defaultCredentials } from '../backend/auth/defaultCredentials';
import { photoFolderId, testUrl } from './testVariables';

const graphqlRequest = async (
  query: string,
  variables: Record<string, unknown>,
  headers: HeadersInit,
) => {
  const response = await fetch(testUrl + 'graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ query, variables }),
  });
  return response.json();
};

test('Admin can set folder title and subtitle', async () => {
  const headers = await getUserHeader(defaultCredentials);

  const updateResult = await graphqlRequest(
    `
      mutation EditFolderTitle($folderId: ID!, $title: String, $subtitle: String) {
        editFolder(folderId: $folderId, title: $title, subtitle: $subtitle) {
          id
          name
          title
          subtitle
        }
      }
    `,
    {
      folderId: photoFolderId,
      title: 'Custom Title',
      subtitle: 'Custom Subtitle',
    },
    headers,
  );

  expect(updateResult.errors).toBeUndefined();
  expect(updateResult.data?.editFolder?.title).toBe('Custom Title');
  expect(updateResult.data?.editFolder?.subtitle).toBe('Custom Subtitle');

  const clearResult = await graphqlRequest(
    `
      mutation ClearFolderTitle($folderId: ID!, $title: String, $subtitle: String) {
        editFolder(folderId: $folderId, title: $title, subtitle: $subtitle) {
          id
          title
          subtitle
        }
      }
    `,
    {
      folderId: photoFolderId,
      title: '',
      subtitle: '',
    },
    headers,
  );

  expect(clearResult.errors).toBeUndefined();
  expect(clearResult.data?.editFolder?.title).toBeNull();
  expect(clearResult.data?.editFolder?.subtitle).toBeNull();
});
