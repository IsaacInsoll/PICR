import { Ionicons } from '@expo/vector-icons';
import { Href, Link } from 'expo-router';
import { HeaderButton } from '@react-navigation/elements';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { navBarIconProps } from '@/src/constants';
import { useHostname } from '@/src/hooks/useHostname';

export const SearchHeaderButton = ({ folderId }: { folderId?: string }) => {
  const hostname = useHostname();
  const theme = useAppTheme();
  const href: Href = {
    pathname: '/[loggedin]/admin/find',
    params: {
      loggedin: hostname ?? '',
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
