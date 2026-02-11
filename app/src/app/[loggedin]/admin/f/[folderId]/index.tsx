import { useMe } from '@/src/hooks/useMe';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { View } from 'react-native';
import { PText } from '@/src/components/PText';
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { usePathname } from 'expo-router/build/hooks';
import { Suspense, useState } from 'react';
import { viewFolderQuery } from '@shared/urql/queries/viewFolderQuery';
import { useQuery } from 'urql';
import { folderCache } from '@/src/helpers/folderCache';
import { AppLoadingIndicator } from '@/src/components/AppLoadingIndicator';
import { PView } from '@/src/components/PView';
import { AppFolderContentsView } from '@/src/components/FolderContents/AppFolderContentsView';
import { useAtomValue } from 'jotai';
import { folderContentsViewModel } from '@shared/files/folderContentsViewModel';
import { fileSortAtom } from '@/src/atoms/atoms';
import {
  getHeadingFontFamilyForLevel,
  normalizeHeadingFontKey,
} from '@/src/helpers/headingFont';
import { SearchHeaderButton } from '@/src/components/SearchHeaderButton';
import {
  FolderHeaderButtons,
  folderViewStyles,
} from '@/src/components/FolderView/FolderViewShared';
import { FolderListHeader } from '@/src/components/FolderView/FolderListHeader';
import { FolderBrandingProvider } from '@/src/components/FolderBrandingProvider';

export default function FolderMasterView() {
  const me = useMe();
  const theme = useAppTheme();
  const pathname = usePathname();
  const { folderId } = useLocalSearchParams();
  const skeleton = folderCache[folderId];
  const [width, setViewWidth] = useState(0);

  if (!folderId) {
    return <Redirect href={pathname + '/' + me.folderId} />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: skeleton?.title ?? skeleton?.name ?? 'Loading Folder...',
        }}
      />
      <View
        style={{ ...folderViewStyles.main, backgroundColor: theme.backgroundColor }}
      >
        <PView style={{ width: '100%', flex: 1 }} onWidthChange={setViewWidth}>
          <Suspense fallback={<AppLoadingIndicator />}>
            <FolderBody folderId={folderId} key={folderId} width={width} />
          </Suspense>
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

  const sort = useAtomValue(fileSortAtom);
  const folder = result.data?.folder;

  if (!folder) {
    return <PText>Folder {folderId} Not Found</PText>;
  }

  const fontKey = normalizeHeadingFontKey(folder.branding?.headingFontKey);
  const headerFontFamily = getHeadingFontFamilyForLevel(fontKey, 3);
  const { items } = folderContentsViewModel(folder, { sort });

  return (
    <FolderBrandingProvider fontKey={fontKey}>
      <Stack.Screen
        options={{
          headerTitle: folder.title ?? folder.name,
          headerTitleStyle: { fontFamily: headerFontFamily },
          headerRight: () => (
            <FolderHeaderButtons>
              <SearchHeaderButton folderId={folderId} />
            </FolderHeaderButtons>
          ),
        }}
      />
      <AppFolderContentsView
        items={items}
        width={width}
        ListHeaderComponent={<FolderListHeader folder={folder} />}
        refresh={() => requery({ requestPolicy: 'cache-and-network' })}
      />
    </FolderBrandingProvider>
  );
};
