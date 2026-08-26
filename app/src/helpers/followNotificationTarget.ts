import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import type { Router } from 'expo-router';
import { notificationTargetFromData } from '@/src/helpers/appRoutes';

export const followNotificationTarget = async (
  data: unknown,
  router: Pick<Router, 'push'>,
) => {
  const target = notificationTargetFromData(data);
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
