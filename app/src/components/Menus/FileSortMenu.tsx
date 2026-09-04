import { cloneElement, useCallback, useMemo, useState } from 'react';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { useAtom } from 'jotai';
import { fileSortAtom } from '@/src/atoms/atoms';
import type { FileSortDirection, FileSortType } from '@shared/files/sortFiles';
import { defaultSortDirection } from '@shared/files/sortFiles';
import { Ionicons } from '@expo/vector-icons';
import { PText } from '@/src/components/PText';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

type SortIconName = ComponentProps<typeof Ionicons>['name'];

export const FileSortMenu = ({
  children,
}: {
  children: ReactElement<{ onPress?: () => void }>;
}) => {
  const [sort, setSort] = useAtom(fileSortAtom);
  const [isOpen, setIsOpen] = useState(false);
  const theme = useAppTheme();

  const openMenu = useCallback(() => setIsOpen(true), []);
  const closeMenu = useCallback(() => setIsOpen(false), []);
  const themedStyles = useMemo(
    () => ({
      sheet: {
        backgroundColor: theme.backgroundColor,
        borderColor: theme.dimmedColor,
      },
      item: {
        borderColor: theme.mode === 'dark' ? '#ffffff22' : '#00000018',
      },
      selectedItem: {
        borderColor: theme.brandColor,
        backgroundColor: theme.brandColor + '1f',
      },
    }),
    [theme.backgroundColor, theme.brandColor, theme.dimmedColor, theme.mode],
  );

  const selectSortType = (value: FileSortType) => {
    setSort((s) =>
      s.type === value
        ? s
        : { type: value, direction: defaultSortDirection(value) },
    );
    closeMenu();
  };

  const selectSortDirection = (value: FileSortDirection) => {
    setSort((s) => ({ ...s, direction: value }));
    closeMenu();
  };

  return (
    <>
      {cloneElement(children, { onPress: openMenu })}
      <Modal
        animationType="fade"
        onRequestClose={closeMenu}
        transparent
        visible={isOpen}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close sort menu"
          onPress={closeMenu}
          style={styles.backdrop}
        >
          <Pressable
            accessibilityRole="menu"
            onPress={(event) => event.stopPropagation()}
            style={[styles.sheet, themedStyles.sheet]}
          >
            <MenuSection label="Sort files">
              {sortOptions.map(({ iconName, label, value }) => (
                <MenuOption
                  key={value}
                  iconName={iconName}
                  label={label}
                  onPress={() => selectSortType(value)}
                  selected={sort.type === value}
                  themedStyles={themedStyles}
                />
              ))}
            </MenuSection>
            <MenuSection label="Direction">
              {sortDirectionOptions.map(({ iconName, label, value }) => (
                <MenuOption
                  key={value}
                  iconName={iconName}
                  label={label}
                  onPress={() => selectSortDirection(value)}
                  selected={sort.direction === value}
                  themedStyles={themedStyles}
                />
              ))}
            </MenuSection>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const MenuSection = ({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) => (
  <View style={styles.section}>
    <PText variant="bold" style={styles.sectionLabel}>
      {label}
    </PText>
    <View style={styles.optionList}>{children}</View>
  </View>
);

const MenuOption = ({
  label,
  onPress,
  selected,
  iconName,
  themedStyles,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
  iconName: SortIconName;
  themedStyles: {
    item: { borderColor: string };
    selectedItem: { borderColor: string; backgroundColor: string };
  };
}) => {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="menuitem"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.option,
        themedStyles.item,
        selected ? themedStyles.selectedItem : undefined,
      ]}
    >
      <Ionicons
        name={iconName}
        size={20}
        color={selected ? theme.brandColor : theme.textColor}
      />
      <PText
        style={[
          styles.optionLabel,
          selected ? { color: theme.brandColor } : undefined,
        ]}
      >
        {label}
      </PText>
    </Pressable>
  );
};

const sortOptions: {
  label: string;
  value: FileSortType;
  iconName: SortIconName;
}[] = [
  {
    label: 'Filename',
    value: 'Filename',
    iconName: 'text-outline',
  },
  { label: 'Last Modified', value: 'LastModified', iconName: 'time-outline' },
  { label: 'Date taken', value: 'DateTaken', iconName: 'camera-outline' },
  {
    label: 'Recently Commented',
    value: 'RecentlyCommented',
    iconName: 'chatbubble-outline',
  },
  { label: 'Rating', value: 'Rating', iconName: 'star-outline' },
];

const sortDirectionOptions: {
  label: string;
  value: FileSortDirection;
  iconName: SortIconName;
}[] = [
  { label: 'Asc', value: 'Asc', iconName: 'chevron-up-outline' },
  { label: 'Desc', value: 'Desc', iconName: 'chevron-down-outline' },
];

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    bottom: 0,
    justifyContent: 'flex-end',
    left: 0,
    padding: 16,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  option: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  optionLabel: {
    fontSize: 16,
  },
  optionList: {
    gap: 8,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 14,
  },
  sheet: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 18,
    maxWidth: 440,
    padding: 16,
    width: '100%',
  },
});
