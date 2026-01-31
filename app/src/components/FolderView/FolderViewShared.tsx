import { StyleSheet, View } from 'react-native';
import { HeaderButton } from '@react-navigation/elements';
import { Ionicons } from '@expo/vector-icons';
import { useSetAtom } from 'jotai';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { navBarIconProps } from '@/src/constants';
import { folderViewModeAtom } from '@/src/atoms/atoms';
import { FileSortMenu } from '@/src/components/Menus/FileSortMenu';
import { GridIcon } from '@/src/components/AppIcons';

export const FolderSortButton = () => {
  const theme = useAppTheme();
  return (
    <FileSortMenu>
      <HeaderButton>
        <Ionicons
          name="chevron-expand-outline"
          size={24}
          color={theme.brandColor}
          style={navBarIconProps}
        />
      </HeaderButton>
    </FileSortMenu>
  );
};

export const FolderViewModeButton = () => {
  const theme = useAppTheme();
  const setView = useSetAtom(folderViewModeAtom);
  const onPress = () => {
    setView((v) => {
      switch (v) {
        case 'list':
          return 'feed';
        case 'feed':
          return 'gallery';
        case 'gallery':
          return 'gallery2';
        case 'gallery2':
          return 'list';
      }
    });
  };
  return (
    <HeaderButton onPress={onPress}>
      <GridIcon size={24} color={theme.brandColor} style={navBarIconProps} />
    </HeaderButton>
  );
};

export const FolderHeaderButtons = ({
  children,
}: {
  children?: React.ReactNode;
}) => (
  <View style={headerButtonsStyle.container}>
    {children}
    <FolderSortButton />
    <FolderViewModeButton />
  </View>
);

const headerButtonsStyle = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 32,
    alignItems: 'center',
  },
});

export const folderViewStyles = StyleSheet.create({
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
});
