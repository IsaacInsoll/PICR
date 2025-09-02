import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { mainFont } from '@/src/constants';

// We have two root navigator stacks: for logged-in users and public users, so consolidate layout to here

export const useNavigationScreenOptions = (): NativeStackNavigationOptions => {
  const theme = useAppTheme();

  return {
    headerStyle: {
      backgroundColor: theme.tabColor,
    },
    headerTitleStyle: { color: theme.textColor, fontFamily: mainFont[2] },
    // headerTitleAlign: 'center', //android defaults to left, reverted as fileView was truncating names to like 3 characters
    headerTintColor: theme.brandColor,
    headerTitle: 'PICR',
    contentStyle: { backgroundColor: theme.backgroundColor },
    // headerLargeTitle: true, //iOS only, looks cool but requires top header on all subviews
  };
};
