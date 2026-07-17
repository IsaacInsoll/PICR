// The folder view overloads the :fileId route segment: 'manage' and 'activity'
// are modes rather than files. Shared so the loading placeholder derives the
// mode the same way the real view does - they must agree on whether a banner is
// shown, or the placeholder renders one that the real page then removes.
export type ViewFolderMode = 'files' | 'manage' | 'activity';

export const viewFolderModeFromFileId = (
  fileId: string | undefined,
): ViewFolderMode =>
  ['manage', 'activity'].includes(fileId ?? '')
    ? (fileId as ViewFolderMode)
    : 'files';
