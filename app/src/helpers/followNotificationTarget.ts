import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import type { Router } from 'expo-router';
import { notificationTargetFromData } from '@/src/helpers/appRoutes';
import type { ServerOrigin } from '@/src/helpers/authenticatedServerOrigin';

export const followNotificationTarget = async (
  data: unknown,
  router: Pick<Router, 'push'>,
  origin?: Pick<ServerOrigin, 'basePath' | 'routeKey'>,
) => {
  const target = notificationTargetFromData(data, origin);
  if (!target) return;

  if (target.type === 'app') {
    router.push(target.href);
    return;
  }

  try {
    await Linking.openURL(target.url);
  } catch (error: unknown) {
    Alert.alert(
      'Unable to open gallery',
      error instanceof Error
        ? error.message
        : 'The gallery link could not be opened.',
    );
  }
};
