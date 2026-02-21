import { expect, test, describe } from 'vitest';
import {
  createTestGraphqlClient,
  getUserHeader,
} from '../../frontend/testGraphqlClient';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { editBrandingMutation } from '../../shared/urql/mutations/editBrandingMutation';
import { deleteBrandingMutation } from '../../shared/urql/mutations/deleteBrandingMutation';
import { setFolderBrandingMutation } from '../../shared/urql/mutations/setFolderBrandingMutation';
import { viewBrandingsQuery } from '../../shared/urql/queries/viewBrandingsQuery';
import { viewFolderQuery } from '../../shared/urql/queries/viewFolderQuery';
import { photoFolderId, videoFolderId } from './testVariables';
import { ThemeMode, PrimaryColor } from '../../graphql-types';

let createdBrandingId: string;

describe('Branding Management', () => {
  test('Admin can create a new branding', async () => {
    const headers = await getUserHeader(defaultCredentials);
    const client = await createTestGraphqlClient(headers);

    const result = await client
      .mutation(editBrandingMutation, {
        name: 'Test Branding',
        mode: ThemeMode.Dark,
        primaryColor: PrimaryColor.Red,
      })
      .toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data?.editBranding?.name).toBe('Test Branding');
    expect(result.data?.editBranding?.mode).toBe('dark');
    expect(result.data?.editBranding?.primaryColor).toBe('red');
    expect(result.data?.editBranding?.folders).toEqual([]);

    createdBrandingId = result.data?.editBranding?.id;
    expect(createdBrandingId).toBeDefined();
  });

  test('Admin can edit an existing branding', async () => {
    const headers = await getUserHeader(defaultCredentials);
    const client = await createTestGraphqlClient(headers);

    const result = await client
      .mutation(editBrandingMutation, {
        id: createdBrandingId,
        name: 'Updated Branding',
        primaryColor: PrimaryColor.Blue,
      })
      .toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data?.editBranding?.name).toBe('Updated Branding');
    expect(result.data?.editBranding?.mode).toBe('dark'); // unchanged
    expect(result.data?.editBranding?.primaryColor).toBe('blue');
  });

  test('Admin can assign branding to a folder', async () => {
    const headers = await getUserHeader(defaultCredentials);
    const client = await createTestGraphqlClient(headers);

    const result = await client
      .mutation(setFolderBrandingMutation, {
        folderId: photoFolderId,
        brandingId: createdBrandingId,
      })
      .toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data?.setFolderBranding?.brandingId).toBe(createdBrandingId);
    expect(result.data?.setFolderBranding?.branding?.name).toBe(
      'Updated Branding',
    );
  });

  test('Branding shows assigned folders', async () => {
    const headers = await getUserHeader(defaultCredentials);
    const client = await createTestGraphqlClient(headers);

    const result = await client.query(viewBrandingsQuery, {}).toPromise();

    expect(result.error).toBeUndefined();
    const branding = result.data?.brandings?.find(
      (b) => b.id === createdBrandingId,
    );
    expect(branding).toBeDefined();
    expect(branding?.folders?.length).toBeGreaterThan(0);
    expect(branding?.folders?.[0]?.id).toBe(photoFolderId);
  });

  test('Child folder inherits parent branding', async () => {
    const headers = await getUserHeader(defaultCredentials);
    const client = await createTestGraphqlClient(headers);

    // Assign branding to root folder
    await client
      .mutation(setFolderBrandingMutation, {
        folderId: '1',
        brandingId: createdBrandingId,
      })
      .toPromise();

    // Clear branding from photo folder so it inherits
    await client
      .mutation(setFolderBrandingMutation, {
        folderId: photoFolderId,
        brandingId: null,
      })
      .toPromise();

    // Check that video folder inherits from root
    const result = await client
      .query(viewFolderQuery, { folderId: videoFolderId })
      .toPromise();

    expect(result.error).toBeUndefined();
    // brandingId should be null (inherited, not directly assigned)
    expect(result.data?.folder?.brandingId).toBeNull();
    // But branding should be resolved via inheritance
    expect(result.data?.folder?.branding?.id).toBe(createdBrandingId);
    expect(result.data?.folder?.branding?.name).toBe('Updated Branding');
  });

  test('Admin can remove branding from folder', async () => {
    const headers = await getUserHeader(defaultCredentials);
    const client = await createTestGraphqlClient(headers);

    // Clear branding from root folder
    const result = await client
      .mutation(setFolderBrandingMutation, {
        folderId: '1',
        brandingId: null,
      })
      .toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data?.setFolderBranding?.brandingId).toBeNull();
    // Should fall back to default branding
    expect(result.data?.setFolderBranding?.branding?.id).toBe('0');
    expect(result.data?.setFolderBranding?.branding?.mode).toBe('auto');
    expect(result.data?.setFolderBranding?.branding?.primaryColor).toBe('blue');
  });

  test('Admin can delete a branding', async () => {
    const headers = await getUserHeader(defaultCredentials);
    const client = await createTestGraphqlClient(headers);

    // First assign branding to a folder
    await client
      .mutation(setFolderBrandingMutation, {
        folderId: photoFolderId,
        brandingId: createdBrandingId,
      })
      .toPromise();

    // Delete the branding
    const deleteResult = await client
      .mutation(deleteBrandingMutation, { id: createdBrandingId })
      .toPromise();

    expect(deleteResult.error).toBeUndefined();
    expect(deleteResult.data?.deleteBranding).toBe(true);

    // Verify folder's brandingId was cleared
    const folderResult = await client
      .query(viewFolderQuery, { folderId: photoFolderId })
      .toPromise();

    expect(folderResult.error).toBeUndefined();
    expect(folderResult.data?.folder?.brandingId).toBeNull();
  });

  test('Creating branding without name fails', async () => {
    const headers = await getUserHeader(defaultCredentials);
    const client = await createTestGraphqlClient(headers);

    const result = await client
      .mutation(editBrandingMutation, { mode: ThemeMode.Light })
      .toPromise();

    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('Name is required');
  });
});
