import type { Href } from 'expo-router';
import type { ServerOrigin } from '@/src/helpers/authenticatedServerOrigin';

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

type ServerRouteOrigin = Pick<ServerOrigin, 'basePath' | 'routeKey'>;

const serverRoutePath = (
  url: URL,
  origin?: ServerRouteOrigin,
): string | null => {
  if (!origin) return url.pathname;
  if (url.host !== origin.routeKey) return null;

  if (url.pathname.startsWith(origin.basePath)) {
    return `/${url.pathname.slice(origin.basePath.length)}`;
  }

  // Custom-scheme and historical notifications may already contain the native
  // route without the server's HTTP base path.
  return url.pathname;
};

const absoluteAuthenticatedHref = (
  value: string,
  origin?: ServerRouteOrigin,
): Href | null => {
  const url = absoluteRoute(value);
  if (!url) return null;
  const path = serverRoutePath(url, origin);
  if (!path || !/^\/admin(?:\/|$)/.test(path)) return null;

  return `/${origin?.routeKey ?? url.host}${path}${url.search}${url.hash}` as Href;
};

const relativeAuthenticatedHref = (
  value: string,
  origin?: ServerRouteOrigin,
): Href | null => {
  const url = relativeRoute(value);
  if (!url) return null;
  const path = serverRoutePath(url, origin);
  return path && /^\/admin(?:\/|$)/.test(path)
    ? (`/${origin?.routeKey ?? url.host}${path}${url.search}${url.hash}` as Href)
    : null;
};

export const authenticatedAppHrefFromIncomingUrl = (
  value: string | null,
  origin?: ServerRouteOrigin,
): Href | null => {
  if (!value) return null;
  return absoluteAuthenticatedHref(value, origin);
};

export const publicGalleryBrowserUrlFromIncomingUrl = (
  value: string | null,
  origin?: ServerRouteOrigin,
): string | null => {
  if (!value) return null;

  if (value.startsWith('/')) {
    const url = relativeRoute(value);
    const path = url ? serverRoutePath(url, origin) : null;
    return url && path && /^\/s\/[^/]+\/[^/]+(?:\/[^/]+)?\/?$/.test(path)
      ? url.toString()
      : null;
  }

  const url = absoluteRoute(value);
  const path = url ? serverRoutePath(url, origin) : null;
  if (!url || !path || !/^\/s\/[^/]+\/[^/]+(?:\/[^/]+)?\/?$/.test(path)) {
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
  origin?: ServerRouteOrigin,
): NotificationTarget | null => {
  if (!data || typeof data !== 'object') return null;
  const url = (data as Record<string, unknown>)['url'];
  if (typeof url !== 'string' || url === '') return null;

  const href = url.startsWith('/')
    ? relativeAuthenticatedHref(url, origin)
    : absoluteAuthenticatedHref(url, origin);
  if (href) return { type: 'app', href };

  const publicGalleryUrl = publicGalleryBrowserUrlFromIncomingUrl(url, origin);
  return publicGalleryUrl ? { type: 'browser', url: publicGalleryUrl } : null;
};
