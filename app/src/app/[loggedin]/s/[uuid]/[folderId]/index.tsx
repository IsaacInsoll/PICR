import { useAppTheme } from '@/src/hooks/useAppTheme';
import { View } from 'react-native';
import { PText } from '@/src/components/PText';
import { Stack, useLocalSearchParams } from 'expo-router';
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
import {
  FolderHeaderButtons,
  folderViewStyles,
} from '@/src/components/FolderView/FolderViewShared';
import { FolderListHeader } from '@/src/components/FolderView/FolderListHeader';
import { FolderBrandingProvider } from '@/src/components/FolderBrandingProvider';

export default function PublicFolderView() {
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ folderId?: string | string[] }>();
  const folderId = Array.isArray(params.folderId)
    ? params.folderId[0]
    : params.folderId;
  const skeleton = folderId ? folderCache[folderId] : undefined;
  const [width, setViewWidth] = useState(0);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: skeleton?.title ?? skeleton?.name ?? 'Loading Folder...',
        }}
      />
      <View
        style={{
          ...folderViewStyles.main,
          backgroundColor: theme.backgroundColor,
        }}
      >
        <PView style={{ width: '100%', flex: 1 }} onWidthChange={setViewWidth}>
          <Suspense fallback={<AppLoadingIndicator />}>
            {folderId ? (
              <FolderBody folderId={folderId} key={folderId} width={width} />
            ) : (
              <PText>Folder Not Found</PText>
            )}
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
          headerRight: () => <FolderHeaderButtons />,
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
