import { describe, expect, it } from '@jest/globals';
import {
  adminDashboardHref,
  adminFileHref,
  adminFolderHref,
  notificationHrefFromData,
} from '@/src/helpers/appRoutes';

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

describe('notificationHrefFromData', () => {
  it('returns a string URL from notification data', () => {
    expect(notificationHrefFromData({ url: '/example/admin/f/12' })).toBe(
      '/example/admin/f/12',
    );
  });

  it.each([undefined, null, {}, { url: '' }, { url: 12 }])(
    'ignores invalid notification data %#',
    (data) => {
      expect(notificationHrefFromData(data)).toBeNull();
    },
  );
});
