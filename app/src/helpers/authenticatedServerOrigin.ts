import type { AllSize } from '@shared/thumbnailSize';
import type { ThumbnailVariantToken } from '@shared/thumbnailVariants';
import type { ImageUrlFileInput } from '@shared/types/ui';
import { imageURL } from '@/src/helpers/imageURL';

export interface ServerOrigin {
  baseUrl: string;
  basePath: string;
  routeKey: string;
  urlForPath: (path: string) => string;
  mediaUrl: (
    file: ImageUrlFileInput,
    size: AllSize | ThumbnailVariantToken,
    extension?: string,
  ) => string;
}

export interface AuthenticatedServerOrigin extends ServerOrigin {
  requestHeaders: Readonly<Record<string, string>>;
}

export const normalizeServerBaseUrl = (value: string): string | null => {
  const trimmed = value.trim();
  if (
    /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) &&
    !/^https?:\/\//i.test(trimmed)
  ) {
    return null;
  }
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    if (
      (url.protocol !== 'http:' && url.protocol !== 'https:') ||
      !url.host ||
      url.username ||
      url.password
    ) {
      return null;
    }

    url.search = '';
    url.hash = '';
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/`;
    return url.toString();
  } catch {
    return null;
  }
};

export const createServerOrigin = (server: string): ServerOrigin | null => {
  const baseUrl = normalizeServerBaseUrl(server);
  if (!baseUrl) return null;

  const url = new URL(baseUrl);
  const basePath = url.pathname;
  const routeKey = url.host;
  const urlForPath = (path: string) => `${baseUrl}${path.replace(/^\/+/, '')}`;

  return {
    baseUrl,
    basePath,
    routeKey,
    urlForPath,
    mediaUrl: (file, size, extension) =>
      urlForPath(imageURL(file, size, extension)),
  };
};

export const createAuthenticatedServerOrigin = ({
  server,
  token,
  userAgent,
}: {
  server: string;
  token?: string;
  userAgent: string;
}): AuthenticatedServerOrigin | null => {
  const origin = createServerOrigin(server);
  if (!origin || !token) return null;

  return {
    ...origin,
    requestHeaders: {
      authorization: `Bearer ${token}`,
      'user-agent': userAgent,
    },
  };
};
