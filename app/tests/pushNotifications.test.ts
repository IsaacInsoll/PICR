import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as Notifications from 'expo-notifications';
import { PermissionStatus } from 'expo-modules-core';
import {
  checkPushNotificationRegistrationAsync,
  registerForPushNotificationsAsync,
} from '@/src/helpers/pushNotifications';

jest.mock('expo-device', () => ({
  isDevice: true,
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: { eas: { projectId: 'project-id' } },
    },
  },
}));

jest.mock('expo-notifications', () => ({
  AndroidImportance: { MAX: 5 },
  getExpoPushTokenAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
}));

const permission = (status: PermissionStatus) => ({
  status,
  expires: 'never' as const,
  granted: status === PermissionStatus.GRANTED,
  canAskAgain: status !== PermissionStatus.DENIED,
});

describe('push notification registration', () => {
  beforeEach(() => {
    jest.mocked(Notifications.getExpoPushTokenAsync).mockReset();
    jest.mocked(Notifications.getPermissionsAsync).mockReset();
    jest.mocked(Notifications.requestPermissionsAsync).mockReset();
    jest.mocked(Notifications.setNotificationChannelAsync).mockReset();
  });

  it('checks existing permission without requesting it', async () => {
    jest
      .mocked(Notifications.getPermissionsAsync)
      .mockResolvedValue(permission(PermissionStatus.UNDETERMINED));

    await expect(checkPushNotificationRegistrationAsync()).resolves.toEqual({
      status: 'permission-required',
    });
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('requests permission and gets a token after explicit registration', async () => {
    jest
      .mocked(Notifications.getPermissionsAsync)
      .mockResolvedValue(permission(PermissionStatus.UNDETERMINED));
    jest
      .mocked(Notifications.requestPermissionsAsync)
      .mockResolvedValue(permission(PermissionStatus.GRANTED));
    jest.mocked(Notifications.getExpoPushTokenAsync).mockResolvedValue({
      type: 'expo',
      data: 'push-token',
    });

    await expect(registerForPushNotificationsAsync()).resolves.toEqual({
      status: 'registered',
      token: 'push-token',
    });
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: 'project-id',
    });
  });

  it('does not mistake registration errors for push tokens', async () => {
    jest
      .mocked(Notifications.getPermissionsAsync)
      .mockResolvedValue(permission(PermissionStatus.GRANTED));
    jest
      .mocked(Notifications.getExpoPushTokenAsync)
      .mockRejectedValue(new Error('registration failed'));

    await expect(registerForPushNotificationsAsync()).resolves.toEqual({
      status: 'error',
    });
  });
});
