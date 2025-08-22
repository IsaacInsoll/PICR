import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppFolderLink, AppLink } from '@/src/components/AppFolderLink';
import { AppImage } from '@/src/components/AppImage';
import { PText } from '@/src/components/PText';
import { File, Folder, Image } from '@shared/gql/graphql';
import { AspectView } from '@/src/components/AspectView';
import { AppLoadingIndicator } from '@/src/components/AppLoadingIndicator';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { addCommentMutation } from '@shared/urql/mutations/addCommentMutation';
import { useMutation } from 'urql';
import { FileCommentsIcon } from '@/src/components/FolderContents/FileCommentsIcon';
import { FileFlagIcon } from '@/src/components/FolderContents/FileFlagIcon';
import { FileRating } from '@/src/components/FolderContents/FileRating';
import { PTitle } from '@/src/components/PTitle';
import { PFileImage } from '@/src/components/PFileImage';
import { AppFileFlagChip } from '@/src/components/chips/AppFileFlagChip';
import { AppFileRatingChip } from '@/src/components/chips/AppFileRatingChip';
import { AppCommentsChip } from '@/src/components/chips/AppCommentsChip';
import { FlashList } from '@shopify/flash-list';
import { AppFolderContentsViewChildProps } from '@/src/components/FolderContents/AppFolderContentsView';

export const AppFolderFileList = ({
  items,
  width,
  refresh,
}: AppFolderContentsViewChildProps) => {
  return (
    <FlashList
      onRefresh={refresh}
      style={{ flex: 1, width: '100%', flexGrow: 1 }}
      data={items}
      numColumns={1}
      keyExtractor={(item) => item['__typename'] + item.id}
      renderItem={({ item, index }) => (
        <AppFileListItem item={item} key={index} width={width} />
      )}
    />
  );
};

export const AppFileListItem = ({
  item,
  width,
  children,
}: {
  item: File | Folder;
  width?: number;
  children?: React.ReactNode;
}) => {
  const isFolder = item['__typename'] == 'Folder';
  const img = isFolder ? item.heroImage : item;
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
          {img?.id ? (
            <PFileImage
              file={img}
              style={{ width: 80, height: 80 }}
              contentFit="contain"
              size="sm"
            />
          ) : null}
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

const FolderDetails = ({ folder }) => {
  return <PText variant="dimmed">Folder</PText>;
};

const FileDetails = ({ file }: { file: File | Image }) => {
  const isImage = file.type == 'Image';
  const { id } = file;
  const [, mutate] = useMutation(addCommentMutation);

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <PText variant="dimmed">{file.type}</PText>
      <AppFileFlagChip flag={file.flag} hideIfNone={true} />
      <AppFileRatingChip rating={file.rating} />
      <AppCommentsChip totalComments={file.totalComments} />
    </View>
  );
};

const styles = StyleSheet.create({
  flashView: {
    minHeight: 32,
    // alignItems: 'center',
    // justifyContent: 'center',
    paddingVertical: 16,
  },
  fileActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  thumbnailBox: { width: 64, height: 64 },
});
