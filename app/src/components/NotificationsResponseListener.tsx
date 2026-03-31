import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import type { Href, Router } from 'expo-router';
import { useRouter } from 'expo-router';

export const NotificationsResponseListener = () => {
  const router = useRouter();
  useEffect(() => {
    const receivedSubscription =
      Notifications.addNotificationReceivedListener(notificationReceived);
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) =>
        notificationResponseReceived(response, router),
      );

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [router]);
  return <></>;
};

const notificationReceived = (event: Notifications.Notification) => {
  // console.log('[notificationreceived]', event);
};

const notificationResponseReceived = (
  event: Notifications.NotificationResponse,
  router: Router,
) => {
  const data = event.notification.request.content.data;
  const url = data?.['url'];
  if (typeof url === 'string') {
    // console.log('navigate to ' + url);
    router.push(url as Href);
  }
  // console.log('[notification response]');
  // console.log(data);
};
