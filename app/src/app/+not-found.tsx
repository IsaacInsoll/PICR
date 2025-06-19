import { Button, SafeAreaView } from 'react-native';
import { Redirect, useNavigation, useRouter } from 'expo-router';
import { AppBrandedBackground } from '@/src/components/AppBrandedBackground';
import { PTitle } from '@/src/components/PTitle';
import { usePathname } from 'expo-router/build/hooks';
import { PText } from '@/src/components/PText';
import { PicrLogo } from '../components/PicrLogo';
import * as Linking from 'expo-linking';

export default function NotFound() {
  const navigation = useNavigation();
  const pathName = usePathname(); //this doesn't include domain
  const path = navigation.getState()?.routes.at(-1)?.path ?? '';
  const router = useRouter();

  const url = Linking.useURL();
  if (url) {
    const { hostname, path, scheme } = Linking.parse(url);
    //the router has resolved eg: picr://mysite.com/123 as /123 rather than /mysite.com/123 so lets redirect
    if (hostname && !path?.includes(hostname)) {
      const target = `/${hostname}/${path}`;
      console.log('[not-found] redirecting to add hostname: ', target);
      return <Redirect href={target} />;
    }
  }

  console.log(navigation.getState());
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
