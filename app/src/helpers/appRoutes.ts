import type { Href } from 'expo-router';

export const adminDashboardHref = (loggedin: string): Href => ({
  pathname: '/[loggedin]/admin',
  params: { loggedin },
});

export const adminFolderHref = (loggedin: string, folderId: string): Href => ({
  pathname: '/[loggedin]/admin/f/[folderId]',
  params: { loggedin, folderId },
});

export const adminFileHref = (
  loggedin: string,
  folderId: string,
  fileId: string,
): Href => ({
  pathname: '/[loggedin]/admin/f/[folderId]/[fileId]',
  params: { loggedin, folderId, fileId },
});

export const notificationHrefFromData = (data: unknown): Href | null => {
  if (!data || typeof data !== 'object') return null;
  const url = (data as Record<string, unknown>)['url'];
  return typeof url === 'string' && url !== '' ? (url as Href) : null;
};
