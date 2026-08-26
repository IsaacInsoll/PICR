import { matchPath } from 'react-router';

const folderRouteSuffix = '/:folderId/:fileId?/:tab?';
export const adminFolderRoute = `/admin/f${folderRouteSuffix}`;
export const publicFolderRoute = `/s/:uuid${folderRouteSuffix}`;

export const folderIdFromPath = (pathname: string) =>
  matchPath(adminFolderRoute, pathname)?.params.folderId ??
  matchPath(publicFolderRoute, pathname)?.params.folderId;
