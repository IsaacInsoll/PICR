import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Router, useRouter } from 'expo-router';

export const NotificationsResponseListener = () => {
  const router = useRouter();
  useEffect(() => {
    const r =
      Notifications.addNotificationReceivedListener(notificationReceived);
    const rr = Notifications.addNotificationResponseReceivedListener((r) =>
      notificationResponseReceived(r, router),
    );

    return () => {
      // Notifications.removeNotificationSubscription(r);
      // Notifications.removeNotificationSubscription(rr);
    };
  }, []);
  return <></>;
};

const notificationReceived = (event: Notifications.Notification) => {
  console.log('[notificationreceived]', event);
};

const notificationResponseReceived = (
  event: Notifications.NotificationResponse,
  router: Router,
) => {
  const data = event.notification.request.content.data;
  if (data.url) {
    console.log('navigate to ' + data.url);
    router.push(data.url);
  }
  console.log('[notification response]');
  console.log(data);
};
