import { useAppTheme } from '@/src/hooks/useAppTheme';
import { StyleSheet, View } from 'react-native';
import { PText } from '@/src/components/PText';
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { usePathname } from 'expo-router/build/hooks';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { viewFolderQuery } from '@shared/urql/queries/viewFolderQuery';
import { useQuery } from 'urql';
import { folderCache } from '@/src/helpers/folderCache';
import { AppLoadingIndicator } from '@/src/components/AppLoadingIndicator';
import { PView } from '@/src/components/PView';
import { AppFolderContentsView } from '@/src/components/FolderContents/AppFolderContentsView';
import { HeaderButton } from '@react-navigation/elements';
import { Ionicons } from '@expo/vector-icons';
import { navBarIconProps } from '@/src/constants';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { PTitle } from '@/src/components/PTitle';
import { AppPicker } from '@/src/components/AppPicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  FileSortDirection,
  FileSortType,
} from '@shared/files/sortFiles';
import { folderContentsViewModel } from '@shared/files/folderContentsViewModel';
import {
  fileSortAtom,
  folderViewModeAtom,
  headingFontKeyAtom,
} from '@/src/atoms/atoms';
import { FileSortMenu } from '@/src/components/Menus/FileSortMenu';
import { GridIcon } from '@/src/components/AppIcons';
import { normalizeHeadingFontKey } from '@/src/helpers/headingFont';

const folderOptionsDialogOpenAtom = atom(false);

export default function PublicFolderView() {
  const theme = useAppTheme();
  const { folderId } = useLocalSearchParams();
  const skeleton = folderCache[folderId];
  const [width, setViewWidth] = useState(0);

  if (!folderId) {
    // TODO: handle error (logged in version just redirects to dashboard but can't do that here)
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: skeleton?.name ?? 'Loading Folder...',
        }}
      />
      <View style={{ ...styles.main, backgroundColor: theme.backgroundColor }}>
        <PView style={{ width: '100%', flex: 1 }} onWidthChange={setViewWidth}>
          <Suspense fallback={<AppLoadingIndicator />}>
            <FolderBody folderId={folderId} key={folderId} width={width} />
          </Suspense>
          {/*<PText variant="dimmed">{x}</PText>*/}
        </PView>
      </View>
    </>
  );
}

const FolderBody = ({
  folderId,
  width,
}: {
  folderId: string;
  width: number;
}) => {
  const setHeadingFontKey = useSetAtom(headingFontKeyAtom);
  const [result, requery] = useQuery({
    query: viewFolderQuery,
    variables: { folderId },
  });

  // const x = useFolder(folderId);

  const sort = useAtomValue(fileSortAtom);
  console.log(result.error);

  const folder = result.data?.folder;
  if (!folder) {
    return <PText>Folder {folderId} Not Found</PText>;
  }

  useEffect(() => {
    setHeadingFontKey(normalizeHeadingFontKey(folder.branding?.headingFontKey));
  }, [folder.branding?.headingFontKey, setHeadingFontKey]);

  //start copied from FolderContentsView.tsx
  // useEffect(() => resetFilters(null), [resetFilters, folderId]);

  // don't memo files because it breaks graphicache (IE: file changing rating won't reflect)
  const { items } = folderContentsViewModel(folder, { sort });

  //end copied from FolderContentsView.tsx

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: folder.name,
          headerRight: () => (
            <View
              style={{
                flexDirection: 'row',
                height: 32,
                alignItems: 'center',
                // backgroundColor: 'red',
              }}
            >
              <FolderOptionsButton />
              <FolderViewButton />
            </View>
          ),
        }}
      />

      <AppFolderContentsView
        items={items}
        width={width}
        refresh={() => requery({ requestPolicy: 'cache-and-network' })}
      />
      {/*<FolderOptions />*/}
    </>
  );
};

const styles = StyleSheet.create({
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
});

const FolderOptionsButton = () => {
  const open = useSetAtom(folderOptionsDialogOpenAtom);
  const theme = useAppTheme();
  return (
    <>
      <FileSortMenu>
        <HeaderButton>
          <Ionicons
            name="chevron-expand-outline"
            size={24}
            color={theme.brandColor}
            style={navBarIconProps} // we need this for Android otherwise it gets cropped to 1px wide :/
          />
        </HeaderButton>
      </FileSortMenu>
    </>
  );
};

const FolderViewButton = () => {
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
      return v == 'feed' ? 'list' : v == 'list' ? 'gallery' : 'feed';
    });
  };
  return (
    <HeaderButton onPress={onPress}>
      <GridIcon size={24} color={theme.brandColor} style={navBarIconProps} />
    </HeaderButton>
  );
};
const FolderOptions = () => {
  const safe = useSafeAreaInsets();
  const [sort, setSort] = useAtom(fileSortAtom);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const theme = useAppTheme();
  const [optionsDialog, setOptionsDialog] = useAtom(
    folderOptionsDialogOpenAtom,
  );
  useEffect(() => {
    if (optionsDialog) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [bottomSheetRef, optionsDialog]);

  const [v, setV] = useState('Filename');

  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
  }, []);
  return (
    <BottomSheet
      ref={bottomSheetRef}
      onChange={handleSheetChanges}
      onClose={() => setOptionsDialog(false)}
      enablePanDownToClose={true}
      index={-1} // start in closed state
      backgroundStyle={{ backgroundColor: theme.backgroundColor + 'ee' }}
      handleIndicatorStyle={{
        backgroundColor: theme.brandColor,
        opacity: 0.5,
      }}
    >
      <BottomSheetView
        style={{
          flex: 1,
          // padding: 36,
          gap: 16,
          alignItems: 'center',
          paddingBottom: safe.bottom, // system bottom bar :/
        }}
      >
        <PTitle level={3}>Sort</PTitle>
        <AppPicker
          options={['Filename', 'LastModified', 'RecentlyCommented', 'Rating']}
          value={sort.type}
          onChange={(type: FileSortType) => setSort((s) => ({ ...s, type }))}
        />
        <AppPicker
          options={['Asc', 'Desc']}
          value={sort.direction}
          onChange={(direction: FileSortDirection) =>
            setSort((s) => ({ ...s, direction }))
          }
        />
        {/*<PText>Awesome2 🎉</PText>*/}
      </BottomSheetView>
    </BottomSheet>
  );
};
