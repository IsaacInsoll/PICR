import { describe, expect, it } from '@jest/globals';
import {
  adminDashboardHref,
  adminFileHref,
  adminFolderHref,
  authenticatedAppHrefFromIncomingUrl,
  notificationTargetFromData,
  publicGalleryBrowserUrlFromIncomingUrl,
} from '@/src/helpers/appRoutes';
import { createServerOrigin } from '@/src/helpers/authenticatedServerOrigin';

const basePathOrigin = createServerOrigin('http://192.168.1.2:6900/picr/');

describe('authenticated app routes', () => {
  it('builds dashboard, folder and file routes with the server route key', () => {
    expect(adminDashboardHref('picr.example.com')).toEqual({
      pathname: '/[loggedin]/admin',
      params: { loggedin: 'picr.example.com' },
    });
    expect(adminFolderHref('picr.example.com', '12')).toEqual({
      pathname: '/[loggedin]/admin/f/[folderId]',
      params: { loggedin: 'picr.example.com', folderId: '12' },
    });
    expect(adminFileHref('picr.example.com', '12', '34')).toEqual({
      pathname: '/[loggedin]/admin/f/[folderId]/[fileId]',
      params: {
        loggedin: 'picr.example.com',
        folderId: '12',
        fileId: '34',
      },
    });
  });
});

describe('authenticated incoming app routes', () => {
  it.each([
    ['picr://picr.example.com/admin', '/picr.example.com/admin'],
    [
      'picr://picr.example.com/admin/find?folderId=12',
      '/picr.example.com/admin/find?folderId=12',
    ],
    [
      'picr://picr.example.com/admin/settings',
      '/picr.example.com/admin/settings',
    ],
    [
      'picrdev://picr.example.com/admin/f/12/34?from=push',
      '/picr.example.com/admin/f/12/34?from=push',
    ],
    ['http://192.168.1.2:6900/admin/f/12', '/192.168.1.2:6900/admin/f/12'],
  ])('normalizes %s to %s', (url, expected) => {
    expect(authenticatedAppHrefFromIncomingUrl(url)).toBe(expected);
  });

  it.each([
    null,
    '',
    'javascript:alert(1)',
    'picr://user@picr.example.com/admin',
    'picr://picr.example.com/s/link-user/12',
    'https://picr.example.com/not-an-app-route',
    'https://picr.example.com/admin/arbitrary',
    'https://picr.example.com/admin/settings/branding',
    'https://picr.example.com/admin/f/not-a-folder',
    'https://picr.example.com/admin/f/12/34/extra',
  ])('rejects non-admin incoming URL %s', (url) => {
    expect(authenticatedAppHrefFromIncomingUrl(url)).toBeNull();
  });

  it('removes the authenticated server base path from native routes', () => {
    expect(
      authenticatedAppHrefFromIncomingUrl(
        'http://192.168.1.2:6900/picr/admin/f/12',
        basePathOrigin ?? undefined,
      ),
    ).toBe('/192.168.1.2:6900/admin/f/12');
  });

  it('rejects authenticated routes for a different logged-in server', () => {
    expect(
      authenticatedAppHrefFromIncomingUrl(
        'https://picr.example.com/admin/f/12',
        basePathOrigin ?? undefined,
      ),
    ).toBeNull();
  });
});

describe('public gallery browser routes', () => {
  it.each([
    [
      'picr://picr.example.com/s/link-user/12',
      'https://picr.example.com/s/link-user/12',
    ],
    [
      'picrdev://picr.example.com/s/link-user/12/34?download=1',
      'https://picr.example.com/s/link-user/12/34?download=1',
    ],
    [
      'http://192.168.1.2:6900/s/link-user/12',
      'http://192.168.1.2:6900/s/link-user/12',
    ],
    [
      '/picr.example.com/s/link-user/12',
      'https://picr.example.com/s/link-user/12',
    ],
  ])('converts %s to %s', (url, expected) => {
    expect(publicGalleryBrowserUrlFromIncomingUrl(url)).toBe(expected);
  });

  it.each([
    null,
    '',
    'javascript:alert(1)',
    '/user@picr.example.com/s/link-user/12',
    'picr://picr.example.com/admin',
    'picr://picr.example.com/s/missing-folder',
  ])('rejects non-gallery URL %s', (url) => {
    expect(publicGalleryBrowserUrlFromIncomingUrl(url)).toBeNull();
  });

  it('preserves the server base path when opening a gallery in the browser', () => {
    expect(
      publicGalleryBrowserUrlFromIncomingUrl(
        'http://192.168.1.2:6900/picr/s/link-user/12',
        basePathOrigin ?? undefined,
      ),
    ).toBe('http://192.168.1.2:6900/picr/s/link-user/12');
  });
});

describe('notificationTargetFromData', () => {
  it('allows authenticated app navigation', () => {
    expect(
      notificationTargetFromData({ url: '/picr.example.com/admin/f/12' }),
    ).toEqual({ type: 'app', href: '/picr.example.com/admin/f/12' });
    expect(
      notificationTargetFromData({
        url: 'picr://picr.example.com/admin/f/12/34',
      }),
    ).toEqual({
      type: 'app',
      href: '/picr.example.com/admin/f/12/34',
    });
  });

  it('sends historical public-gallery targets to the browser', () => {
    expect(
      notificationTargetFromData({
        url: 'picr://picr.example.com/s/link-user/12',
      }),
    ).toEqual({
      type: 'browser',
      url: 'https://picr.example.com/s/link-user/12',
    });
  });

  it('uses the authenticated origin for base-path notification URLs', () => {
    expect(
      notificationTargetFromData(
        { url: '/192.168.1.2:6900/picr/admin/f/12' },
        basePathOrigin ?? undefined,
      ),
    ).toEqual({ type: 'app', href: '/192.168.1.2:6900/admin/f/12' });
  });

  it.each([
    undefined,
    null,
    {},
    { url: '' },
    { url: 12 },
    { url: 'https://picr.example.com/arbitrary' },
    { url: 'https://picr.example.com/admin/settings/branding' },
  ])('ignores invalid or unrelated notification data %#', (data) => {
    expect(notificationTargetFromData(data)).toBeNull();
  });
});
