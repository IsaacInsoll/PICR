import * as Device from 'expo-device';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import type { NotificationChannelInput } from 'expo-notifications';

export type PushNotificationRegistration =
  | { status: 'registered'; token: string }
  | {
      status:
        | 'permission-required'
        | 'permission-denied'
        | 'unavailable'
        | 'error';
    };

const resolvePushNotificationRegistration = async (
  requestPermission: boolean,
): Promise<PushNotificationRegistration> => {
  if (!Device.isDevice) {
    // console.log('[pushNotifications] skipping because not real device');
    return { status: 'unavailable' };
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('PICR', androidChannel);
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      if (!requestPermission) return { status: 'permission-required' };

      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return { status: 'permission-denied' };
    }

    const easConfig = Constants.expoConfig?.extra?.['eas'];
    const projectId =
      easConfig && typeof easConfig === 'object'
        ? (easConfig as Record<string, unknown>)['projectId']
        : undefined;
    if (typeof projectId !== 'string' || projectId === '') {
      throw new Error('Project ID not found');
    }
    const token = (await Notifications.getExpoPushTokenAsync({ projectId }))
      .data;
    return { status: 'registered', token };
  } catch {
    return { status: 'error' };
  }
};

export const checkPushNotificationRegistrationAsync = () =>
  resolvePushNotificationRegistration(false);

export const registerForPushNotificationsAsync = () =>
  resolvePushNotificationRegistration(true);

const androidChannel: NotificationChannelInput = {
  name: 'PICR',
  importance: Notifications.AndroidImportance.MAX,
  // vibrationPattern: [0, 250, 250, 250],
  // lightColor: '#FF231F7C',
};
