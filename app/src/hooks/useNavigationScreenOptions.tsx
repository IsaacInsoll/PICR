import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { mainFont } from '@/src/constants';
import { Platform } from 'react-native';

// We have two root navigator stacks: for logged-in users and public users, so consolidate layout to here

export const useNavigationScreenOptions = (): NativeStackNavigationOptions => {
  const theme = useAppTheme();
  const isAndroid = Platform.OS == 'android'; // if you change this, also update AppHeaderPadding
  return {
    headerStyle: isAndroid
      ? {
          backgroundColor: theme.tabColor,
        }
      : undefined,
    headerTitleStyle: { color: theme.textColor, fontFamily: mainFont[2] },
    // headerTitleAlign: 'center', //android defaults to left, reverted as fileView was truncating names to like 3 characters
    headerTintColor: theme.brandColor,
    headerTitle: 'PICR',
    contentStyle: isAndroid
      ? { backgroundColor: theme.backgroundColor }
      : undefined,
    // headerLargeTitle: true, //iOS only, looks cool but requires top header on all subviews
    headerTransparent: !isAndroid,
    headerBlurEffect: isIOS26OrHigher() ? undefined : 'regular', //default gradient on iOS 26 is enough
  };
};

const isIOS26OrHigher = () => {
  if (Platform.OS === 'ios') {
    const majorVersionIOS = parseInt(Platform.Version, 10);
    return majorVersionIOS >= 26;
  }
  return false;
};
