import '@/src/polyfills';
import { Slot, useRouter } from 'expo-router';
import { ThemeProvider } from '@/src/components/themeProvider';

import { CacheManager } from '@georstat/react-native-image-cache';
import { Dirs } from 'react-native-file-access';

//full sreen image zoom
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppErrorBoundary } from '@/src/components/AppErrorBoundary';
import * as Notifications from 'expo-notifications';
import { NotificationsResponseListener } from '@/src/components/NotificationsResponseListener';
import { useLastNotificationResponse } from 'expo-notifications';
import { useEffect, useMemo } from 'react';
import { GlobalErrorOverlay } from '@/src/components/GlobalErrorOverlay';
import { followNotificationTarget } from '@/src/helpers/followNotificationTarget';
import { useLoginDetails } from '@/src/hooks/useLoginDetails';
import { createServerOrigin } from '@/src/helpers/authenticatedServerOrigin';

CacheManager.config = {
  baseDir: `${Dirs.CacheDir}/images_cache/`,
  blurRadius: 15,
  cacheLimit: 0,
  maxRetries: 3,
  retryDelay: 3000, //ms
  sourceAnimationDuration: 1,
  thumbnailAnimationDuration: 1,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function AppLayout() {
  // This is the 'entrypoint' for the app :)
  // console.log('PICR App Booting');
  const lastNotification = useLastNotificationResponse();
  const router = useRouter();
  const login = useLoginDetails();
  const origin = useMemo(
    () => (login ? createServerOrigin(login.server) : null),
    [login],
  );
  useEffect(() => {
    const data = lastNotification?.notification.request.content.data;
    if (data) {
      // console.log([
      //   'AppLayout',
      //   'redirecting because of cold boot URL: ' + url,
      // ]);
      setTimeout(
        () => void followNotificationTarget(data, router, origin ?? undefined),
        300,
      );
    }
  }, [lastNotification, origin, router]);

  return (
    <AppErrorBoundary>
      <NotificationsResponseListener />
      <GestureHandlerRootView>
        <SafeAreaProvider>
          <ThemeProvider>
            <Slot />
            <GlobalErrorOverlay />
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}
