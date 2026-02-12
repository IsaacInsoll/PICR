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
import { useEffect } from 'react';
import { GlobalErrorOverlay } from '@/src/components/GlobalErrorOverlay';

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
  console.log('PICR App Booting');
  const lastNotification = useLastNotificationResponse();
  const router = useRouter();
  useEffect(() => {
    // if (lastNotification);
    const url = lastNotification?.notification.request.content.data.url;

    if (url) {
      console.log([
        'AppLayout',
        'redirecting because of cold boot URL: ' + url,
      ]);
      setTimeout(() => router.push(url), 300);
    }
  }, [lastNotification]);

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
