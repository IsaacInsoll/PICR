import { useMe } from '@/src/hooks/useMe';
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
import { atom, useAtom, useSetAtom } from 'jotai';
import { PTitle } from '@/src/components/PTitle';
import { AppPicker } from '@/src/components/AppPicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const folderOptionsDialogOpenAtom = atom(false);

export default function FolderMasterView() {
  const me = useMe();
  const theme = useAppTheme();
  const x = usePathname();
  const { folderId } = useLocalSearchParams();
  const skeleton = folderCache[folderId];
  const [width, setViewWidth] = useState(0);

  if (!folderId) {
    console.log(
      '[folderId.tsx] redirecting to home folder as no folder specified',
    );
    return <Redirect href={x + '/' + me.folderId} />;
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
  const [result, requery] = useQuery({
    query: viewFolderQuery,
    variables: { folderId },
  });

  const f = result.data?.folder;
  if (!f) {
    return <PText>Folder {folderId} Not Found</PText>;
  }
  const items = [...f.subFolders, ...f.files];

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: f.name,
          headerRight: () => <FolderOptionsButton />,
        }}
      />

      <AppFolderContentsView folder={f} width={width} />
      <FolderOptions />
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
    <HeaderButton onPress={() => open((b) => !b)}>
      <Ionicons
        name="options-outline"
        size={25}
        color={theme.brandColor}
        style={navBarIconProps} // we need this for Android otherwise it gets cropped to 1px wide :/
      />
    </HeaderButton>
  );
};

const FolderOptions = () => {
  const safe = useSafeAreaInsets();

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
  console.log('v', v);

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
      backgroundStyle={{ backgroundColor: theme.backgroundColor }}
      handleIndicatorStyle={{
        backgroundColor: theme.brandColor,
        opacity: 0.5,
      }}
    >
      <BottomSheetView
        style={{
          flex: 1,
          // padding: 36,
          alignItems: 'center',
          paddingBottom: safe.bottom, // system bottom bar :/
        }}
      >
        <PTitle level={3}>Sort</PTitle>
        <AppPicker
          options={['Filename', 'Modified', 'Commented', 'Rating']}
          value={v}
          onChange={setV}
        />
        <PText>Awesome2 🎉</PText>
      </BottomSheetView>
    </BottomSheet>
  );
};
