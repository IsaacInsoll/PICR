import type { Href } from 'expo-router';

export type NotificationTarget =
  | { type: 'app'; href: Href }
  | { type: 'browser'; url: string };

const appProtocols = new Set(['picr:', 'picrdev:', 'http:', 'https:']);

const absoluteRoute = (value: string): URL | null => {
  try {
    const url = new URL(value);
    return appProtocols.has(url.protocol) &&
      url.host &&
      !url.username &&
      !url.password
      ? url
      : null;
  } catch {
    return null;
  }
};

const relativeRoute = (value: string): URL | null =>
  value.startsWith('/') ? absoluteRoute(`https://${value.slice(1)}`) : null;

const absoluteAuthenticatedHref = (value: string): Href | null => {
  const url = absoluteRoute(value);
  if (!url || !/^\/admin(?:\/|$)/.test(url.pathname)) return null;

  return `/${url.host}${url.pathname}${url.search}${url.hash}` as Href;
};

const relativeAuthenticatedHref = (value: string): Href | null => {
  const url = relativeRoute(value);
  return url && /^\/admin(?:\/|$)/.test(url.pathname)
    ? (`/${url.host}${url.pathname}${url.search}${url.hash}` as Href)
    : null;
};

export const authenticatedAppHrefFromIncomingUrl = (
  value: string | null,
): Href | null => {
  if (!value) return null;
  return absoluteAuthenticatedHref(value);
};

export const publicGalleryBrowserUrlFromIncomingUrl = (
  value: string | null,
): string | null => {
  if (!value) return null;

  if (value.startsWith('/')) {
    const url = relativeRoute(value);
    return url && /^\/s\/[^/]+\/[^/]+(?:\/[^/]+)?\/?$/.test(url.pathname)
      ? url.toString()
      : null;
  }

  const url = absoluteRoute(value);
  if (!url || !/^\/s\/[^/]+\/[^/]+(?:\/[^/]+)?\/?$/.test(url.pathname)) {
    return null;
  }

  if (url.protocol === 'http:' || url.protocol === 'https:') {
    return url.toString();
  }

  return `https://${url.host}${url.pathname}${url.search}${url.hash}`;
};

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

export const notificationTargetFromData = (
  data: unknown,
): NotificationTarget | null => {
  if (!data || typeof data !== 'object') return null;
  const url = (data as Record<string, unknown>)['url'];
  if (typeof url !== 'string' || url === '') return null;

  const href = url.startsWith('/')
    ? relativeAuthenticatedHref(url)
    : absoluteAuthenticatedHref(url);
  if (href) return { type: 'app', href };

  const publicGalleryUrl = publicGalleryBrowserUrlFromIncomingUrl(url);
  return publicGalleryUrl ? { type: 'browser', url: publicGalleryUrl } : null;
};
