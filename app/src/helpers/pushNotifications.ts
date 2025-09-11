import * as Device from 'expo-device';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { NotificationChannelInput } from 'expo-notifications';

// Get expo push notification token and ask user for permissions (if required)
export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log('[pushNotifications] skipping because not real device');
    return;
  }
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('PICR', androidChannel);
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }

  try {
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      throw new Error('Project ID not found');
    }
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log(token);
  } catch (e) {
    console.error(e);
    token = `${e}`;
  }
  return token;
}

const androidChannel: NotificationChannelInput = {
  name: 'PICR',
  importance: Notifications.AndroidImportance.MAX,
  // vibrationPattern: [0, 250, 250, 250],
  // lightColor: '#FF231F7C',
};
