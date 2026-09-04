import { Button } from 'react-native';
import { Redirect, useNavigation, usePathname, useRouter } from 'expo-router';
import { AppBrandedBackground } from '@/src/components/AppBrandedBackground';
import { PTitle } from '@/src/components/PTitle';
import { PText } from '@/src/components/PText';
import { PicrLogo } from '../components/PicrLogo';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useState } from 'react';
import {
  authenticatedAppHrefFromIncomingUrl,
  publicGalleryBrowserUrlFromIncomingUrl,
} from '@/src/helpers/appRoutes';
import { useLoginDetails } from '@/src/hooks/useLoginDetails';
import { createServerOrigin } from '@/src/helpers/authenticatedServerOrigin';

export default function NotFound() {
  const navigation = useNavigation();
  const pathName = usePathname(); //this doesn't include domain
  const path = navigation.getState()?.routes.at(-1)?.path ?? '';
  const router = useRouter();

  const url = Linking.useURL();
  const login = useLoginDetails();
  const origin = login ? createServerOrigin(login.server) : null;
  const authenticatedHref = authenticatedAppHrefFromIncomingUrl(
    url,
    origin ?? undefined,
  );
  const publicGalleryUrl = publicGalleryBrowserUrlFromIncomingUrl(
    url,
    origin ?? undefined,
  );
  const [galleryOpenFailed, setGalleryOpenFailed] = useState(false);
  const launchPublicGallery = useCallback(async () => {
    if (!publicGalleryUrl) return;

    try {
      await Linking.openURL(publicGalleryUrl);
      router.replace('/');
      return true;
    } catch {
      return false;
    }
  }, [publicGalleryUrl, router]);

  useEffect(() => {
    let cancelled = false;
    void launchPublicGallery().then((opened) => {
      if (!cancelled && opened === false) setGalleryOpenFailed(true);
    });

    return () => {
      cancelled = true;
    };
  }, [launchPublicGallery]);

  const retryPublicGallery = async () => {
    setGalleryOpenFailed(false);
    const opened = await launchPublicGallery();
    if (opened === false) setGalleryOpenFailed(true);
  };

  if (authenticatedHref) return <Redirect href={authenticatedHref} />;

  if (publicGalleryUrl) {
    return (
      <AppBrandedBackground>
        <SafeAreaView
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          <PicrLogo style={{ width: 48 }} />
          <PTitle>Opening gallery in your browser</PTitle>
          {galleryOpenFailed ? (
            <>
              <PText variant="dimmed">
                The gallery link could not be opened.
              </PText>
              <Button
                onPress={() => void retryPublicGallery()}
                title="Try again"
              />
            </>
          ) : null}
        </SafeAreaView>
      </AppBrandedBackground>
    );
  }

  // console.log(navigation.getState());
  return (
    <AppBrandedBackground>
      <SafeAreaView
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <PicrLogo style={{ width: 48 }} />
        <PTitle>Whoops, not found!</PTitle>
        <PText variant="dimmed">{path}</PText>
        <PText variant="dimmed">pathName: {pathName}</PText>
        <Button onPress={() => router.replace('/')} title="Go Home" />
      </SafeAreaView>
    </AppBrandedBackground>
  );
}
