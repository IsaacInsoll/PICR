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

export default function NotFound() {
  const navigation = useNavigation();
  const pathName = usePathname(); //this doesn't include domain
  const path = navigation.getState()?.routes.at(-1)?.path ?? '';
  const router = useRouter();

  const url = Linking.useURL();
  const authenticatedHref = authenticatedAppHrefFromIncomingUrl(url);
  const publicGalleryUrl = publicGalleryBrowserUrlFromIncomingUrl(url);
  const [galleryOpenFailed, setGalleryOpenFailed] = useState(false);
  const openPublicGallery = useCallback(async () => {
    if (!publicGalleryUrl) return;

    setGalleryOpenFailed(false);
    try {
      await Linking.openURL(publicGalleryUrl);
      router.replace('/');
    } catch {
      setGalleryOpenFailed(true);
    }
  }, [publicGalleryUrl, router]);

  useEffect(() => {
    void openPublicGallery();
  }, [openPublicGallery]);

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
                onPress={() => void openPublicGallery()}
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
