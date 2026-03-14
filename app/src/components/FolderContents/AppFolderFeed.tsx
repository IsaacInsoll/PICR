import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppFileLink, AppFolderLink } from '@/src/components/AppFolderLink';
import { AppImage } from '@/src/components/AppImage';
import { PText } from '@/src/components/PText';
import { AspectView } from '@/src/components/AspectView';
import { Suspense } from 'react';
import { AppLoadingIndicator } from '@/src/components/AppLoadingIndicator';
import { addCommentMutation } from '@shared/urql/mutations/addCommentMutation';
import { useMutation } from 'urql';
import { FileCommentsIcon } from '@/src/components/FolderContents/FileCommentsIcon';
import { FileFlagIcon } from '@/src/components/FolderContents/FileFlagIcon';
import { FileRating } from '@/src/components/FolderContents/FileRating';
import { PTitle } from '@/src/components/PTitle';
import { FlashList } from '@shopify/flash-list';
import type { AppFolderContentsViewChildProps } from '@/src/components/FolderContents/AppFolderContentsView';
import { AppVideo } from '@/src/components/AppVideo';
import { PFileFolderThumbnail } from '@/src/components/PFileView';
import { AppFooterPadding } from '@/src/components/AppHeaderPadding';
import type { FileFlag } from '@shared/gql/graphql';
import type {
  FolderContentsItem,
  ViewFolderFileWithHero,
  ViewFolderSubFolder,
} from '@shared/files/folderContentsViewModel';
import { isFolderContentsFile } from '@shared/files/folderContentsViewModel';

export const AppFolderFeed = ({
  items,
  width,
  refresh,
  ListHeaderComponent,
}: AppFolderContentsViewChildProps) => {
  return (
    <FlashList
      onRefresh={refresh}
      style={{ flex: 1, width: '100%', flexGrow: 1 }}
      data={items}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={<AppFooterPadding />}
      numColumns={1}
      keyExtractor={(item) => item.__typename + item.id}
      renderItem={(props) => renderItem({ ...props, width })}
    />
  );
};

const renderItem = ({
  item,
  width,
}: {
  item: FolderContentsItem;
  width: number;
}) => {
  const isFolder = !isFolderContentsFile(item);

  return isFolder ? (
    <FlashFolder folder={item} key={item.id} width={width} />
  ) : (
    <FlashFile file={item} key={item.id} width={width} />
  );
};

const FlashFolder = ({
  folder,
  width,
}: {
  folder: ViewFolderSubFolder;
  width: number;
}) => {
  return (
    <AppFolderLink folder={folder} asChild>
      <TouchableOpacity>
        {folder.heroImage?.id ? (
          <AppImage file={folder.heroImage} width={width} />
        ) : (
          <PFileFolderThumbnail folder={folder} style={{ minHeight: 200 }} />
        )}
        <PTitle level={4} style={[styles.flashView]}>
          {folder.name}
        </PTitle>
      </TouchableOpacity>
    </AppFolderLink>
  );
};

const FlashFile = ({
  file,
  width,
}: {
  file: ViewFolderFileWithHero;
  width: number;
}) => {
  const isImage = file.__typename === 'Image';
  const isVideoFile = file.__typename === 'Video';
  const { id } = file;
  const [, mutate] = useMutation(addCommentMutation);
  const handleFlagChange = (flag?: FileFlag) => {
    void mutate({ id, flag });
  };
  const handleRatingChange = (rating: number) => {
    void mutate({ id, rating });
  };

  return (
    <AppFileLink file={file} asChild isDisabled={isVideoFile}>
      <TouchableOpacity>
        {isImage ? (
          <AspectView ratio={file.imageRatio ?? undefined} width={width}>
            <Suspense fallback={<AppLoadingIndicator />}>
              <AppImage file={file} width={width} />
            </Suspense>
          </AspectView>
        ) : null}
        {isVideoFile ? (
          <AspectView ratio={file.imageRatio ?? undefined} width={width}>
            <Suspense fallback={<AppLoadingIndicator />}>
              <AppVideo file={file} width={width} />
            </Suspense>
          </AspectView>
        ) : null}
        <View style={styles.fileActions}>
          {/*TODO: HeroImageSet, Info, Download */}
          <PText style={[styles.flashView]}>{file.name}</PText>
          <FileFlagIcon file={file} onChange={handleFlagChange} />
          <FileRating file={file} onChange={handleRatingChange} />
          <FileCommentsIcon file={file} />
        </View>
      </TouchableOpacity>
    </AppFileLink>
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
});
