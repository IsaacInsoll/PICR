import { TouchableOpacity, View } from 'react-native';
import { AppLink } from '@/src/components/AppFolderLink';
import { PText } from '@/src/components/PText';
import { PTitle } from '@/src/components/PTitle';
import { AppFileFlagChip } from '@/src/components/chips/AppFileFlagChip';
import { AppFileRatingChip } from '@/src/components/chips/AppFileRatingChip';
import { AppCommentsChip } from '@/src/components/chips/AppCommentsChip';
import { FlashList } from '@shopify/flash-list';
import type { AppFolderContentsViewChildProps } from '@/src/components/FolderContents/AppFolderContentsView';
import { PFileView } from '@/src/components/PFileView';
import { AppFooterPadding } from '@/src/components/AppHeaderPadding';
import type {
  FolderContentsItem,
  ViewFolderFileWithHero,
  ViewFolderSubFolder,
} from '@shared/files/folderContentsViewModel';
import { isFolderContentsFile } from '@shared/files/folderContentsViewModel';

export const AppFolderFileList = ({
  items,
  refresh,
  ListHeaderComponent,
}: AppFolderContentsViewChildProps) => {
  return (
    <FlashList
      onRefresh={refresh}
      style={{ flex: 1, width: '100%', flexGrow: 1 }}
      data={items}
      numColumns={1}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={<AppFooterPadding />}
      keyExtractor={(item) => item.__typename + item.id}
      renderItem={({ item, index }) => (
        <AppFileListItem item={item} key={index} />
      )}
    />
  );
};

export const AppFileListItem = ({
  item,
  children,
}: {
  item: FolderContentsItem;
  children?: React.ReactNode;
}) => {
  const isFolder = !isFolderContentsFile(item);
  return (
    <AppLink item={item} asChild={true}>
      <TouchableOpacity>
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <PFileView file={item} variant="rounded-fit" size="sm" />
          <View style={{ gap: 4 }}>
            <PTitle level={4}>{item.name}</PTitle>
            {children ? (
              children
            ) : isFolder ? (
              <FolderDetails folder={item} />
            ) : (
              <FileDetails file={item} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </AppLink>
  );
};

const FolderDetails = ({ folder }: { folder: ViewFolderSubFolder }) => {
  void folder;
  return <PText variant="dimmed">Folder</PText>;
};

const FileDetails = ({ file }: { file: ViewFolderFileWithHero }) => {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <PText variant="dimmed">{file.type}</PText>
      <AppFileFlagChip flag={file.flag ?? undefined} hideIfNone={true} />
      <AppFileRatingChip rating={file.rating ?? undefined} />
      <AppCommentsChip totalComments={file.totalComments ?? undefined} />
    </View>
  );
};
