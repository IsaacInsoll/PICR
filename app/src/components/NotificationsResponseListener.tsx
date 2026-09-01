import { useEffect, useMemo } from 'react';
import * as Notifications from 'expo-notifications';
import type { Router } from 'expo-router';
import { useRouter } from 'expo-router';
import { followNotificationTarget } from '@/src/helpers/followNotificationTarget';
import { useLoginDetails } from '@/src/hooks/useLoginDetails';
import { createServerOrigin } from '@/src/helpers/authenticatedServerOrigin';
import type { ServerOrigin } from '@/src/helpers/authenticatedServerOrigin';

export const NotificationsResponseListener = () => {
  const router = useRouter();
  const login = useLoginDetails();
  const origin = useMemo(
    () => (login ? createServerOrigin(login.server) : null),
    [login],
  );
  useEffect(() => {
    const receivedSubscription =
      Notifications.addNotificationReceivedListener(notificationReceived);
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) =>
        notificationResponseReceived(response, router, origin ?? undefined),
      );

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [origin, router]);
  return <></>;
};

const notificationReceived = (event: Notifications.Notification) => {
  // console.log('[notificationreceived]', event);
};

const notificationResponseReceived = (
  event: Notifications.NotificationResponse,
  router: Router,
  origin?: Pick<ServerOrigin, 'basePath' | 'routeKey'>,
) => {
  const data = event.notification.request.content.data;
  void followNotificationTarget(data, router, origin);
  // console.log('[notification response]');
  // console.log(data);
};
