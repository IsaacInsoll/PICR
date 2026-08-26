import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { followNotificationTarget } from '@/src/helpers/followNotificationTarget';

describe('followNotificationTarget', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('pushes authenticated routes inside the app', async () => {
    const push = jest.fn();
    const openURL = jest.spyOn(Linking, 'openURL');

    await followNotificationTarget(
      { url: 'picr://picr.example.com/admin/f/12' },
      { push },
    );

    expect(push).toHaveBeenCalledWith('/picr.example.com/admin/f/12');
    expect(openURL).not.toHaveBeenCalled();
  });

  it('opens client galleries in the browser', async () => {
    const push = jest.fn();
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    await followNotificationTarget(
      { url: 'picr://picr.example.com/s/link-user/12' },
      { push },
    );

    expect(openURL).toHaveBeenCalledWith(
      'https://picr.example.com/s/link-user/12',
    );
    expect(push).not.toHaveBeenCalled();
  });

  it('ignores unrelated notification URLs', async () => {
    const push = jest.fn();
    const openURL = jest.spyOn(Linking, 'openURL');

    await followNotificationTarget(
      { url: 'https://example.com/not-a-picr-route' },
      { push },
    );

    expect(push).not.toHaveBeenCalled();
    expect(openURL).not.toHaveBeenCalled();
  });

  it('reports browser launch failures', async () => {
    const error = new Error('No browser is available');
    jest.spyOn(Linking, 'openURL').mockRejectedValue(error);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    await followNotificationTarget(
      { url: 'picr://picr.example.com/s/link-user/12' },
      { push: jest.fn() },
    );

    expect(alert).toHaveBeenCalledWith('Unable to open gallery', error.message);
  });
});
