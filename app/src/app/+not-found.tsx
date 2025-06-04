import { Button, SafeAreaView, Text } from 'react-native';
import { useGlobalSearchParams, useNavigation, useRouter } from 'expo-router';
import { AppBrandedBackground } from '@/src/components/AppBrandedBackground';
import { PTitle } from '@/src/components/PTitle';
import { usePathname } from 'expo-router/build/hooks';
import { PText } from '@/src/components/PText';
import { PicrLogo } from '../components/PicrLogo';
export default function NotFound() {
  const navigation = useNavigation();
  // const path = usePathname(); //this doesn't include domain
  const path = navigation.getState()?.routes.at(-1)?.path ?? '';
  const router = useRouter();

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
        <Button onPress={() => router.replace('/')} title="Go Home" />
      </SafeAreaView>
    </AppBrandedBackground>
  );
}
