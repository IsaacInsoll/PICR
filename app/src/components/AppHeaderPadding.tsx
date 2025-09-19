import { useHeaderHeight } from '@react-navigation/elements';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// empty header that is exact height of Expo Router header to 'pad out' content so it doesn't spawn under header
// if you change this, also update useNavigationScreenOptions
// ignored on android currently as we don't have transparent headers
export const AppHeaderPadding = () => {
  const headerHeight = useHeaderHeight();
  const isAndroid = Platform.OS == 'android';
  if (isAndroid) return undefined;
  return <View style={{ height: headerHeight }} />;
};

export const AppFooterPadding = () => {
  const safe = useSafeAreaInsets();
  return <View style={{ height: safe.bottom }} />;
};
