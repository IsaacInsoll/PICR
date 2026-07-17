import { useLocation, useNavigate } from 'react-router';

import { useSetFolder } from './useSetFolder';

// Opening a file pushes a history entry, so closing it must pop that entry rather
// than push the folder URL again. Pushing on close leaves the just-closed file in
// the history (folder -> file -> folder), so the browser back button reopens the
// image the user deliberately dismissed, and every open/close cycle adds another
// pair of entries to escape from. See issue #68.
const lightboxHistoryState = { openedFromFolder: true };

// The marker only exists on entries we pushed ourselves. A file URL opened directly
// (shared deep link, reload, pasted URL) has no folder entry behind it, so closing
// must replace instead of popping the user off the site entirely.
const wasOpenedFromFolder = (state: unknown) =>
  typeof state === 'object' &&
  state !== null &&
  'openedFromFolder' in state &&
  (state as { openedFromFolder?: unknown }).openedFromFolder === true;

export const useSelectedFileId = (folderId: string) => {
  const setFolder = useSetFolder();
  const navigate = useNavigate();
  const location = useLocation();

  return (fileId: string | undefined) => {
    if (fileId) {
      setFolder({ id: folderId }, fileId, { state: lightboxHistoryState });
    } else if (wasOpenedFromFolder(location.state)) {
      void navigate(-1);
    } else {
      setFolder({ id: folderId }, undefined, { replace: true });
    }
  };
};
