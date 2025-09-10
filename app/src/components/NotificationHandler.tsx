import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
// import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
export const NotificationHandler = () => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [channels, setChannels] = useState<Notifications.NotificationChannel[]>(
    [],
  );
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >(undefined);
  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      console.log('[NotificationHandler]', token);
      return token && setExpoPushToken(token);
    });

    if (Platform.OS === 'android') {
      Notifications.getNotificationChannelsAsync().then((value) =>
        setChannels(value ?? []),
      );
    }
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      },
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);
  return <></>;
};

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log('[NotificationHandler] skipping because not real device');
    return false;
  }
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('PICR', {
      name: 'PICR',
      importance: Notifications.AndroidImportance.MAX,
      // vibrationPattern: [0, 250, 250, 250],
      // lightColor: '#FF231F7C',
    });
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
