import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import { HeaderButton } from 'expo-router/react-navigation';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { navBarIconProps } from '@/src/constants';
import { useAuthenticatedServerOrigin } from '@/src/components/AuthenticatedServerOriginProvider';

export const SearchHeaderButton = ({ folderId }: { folderId?: string }) => {
  const origin = useAuthenticatedServerOrigin();
  const theme = useAppTheme();
  const href: Href = {
    pathname: '/[loggedin]/admin/find',
    params: {
      loggedin: origin.routeKey,
      ...(folderId ? { folderId } : {}),
    },
  };

  return (
    <HeaderButton>
      <Link href={href} asChild>
        <Ionicons
          name="search-outline"
          size={24}
          color={theme.brandColor}
          style={navBarIconProps}
        />
      </Link>
    </HeaderButton>
  );
};
