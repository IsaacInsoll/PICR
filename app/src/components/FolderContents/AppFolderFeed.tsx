import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppFileLink, AppFolderLink } from '@/src/components/AppFolderLink';
import { AppImage } from '@/src/components/AppImage';
import { PText } from '@/src/components/PText';
import { File, Image } from '@shared/gql/graphql';
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
import { AppFolderContentsViewChildProps } from '@/src/components/FolderContents/AppFolderContentsView';
import { fileProps } from '@shared/files/fileProps';
import { AppVideo } from '@/src/components/AppVideo';
import { PFileFolderThumbnail } from '@/src/components/PFileView';
import { AppFooterPadding } from '@/src/components/AppHeaderPadding';

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
      keyExtractor={(item) => item['__typename'] + item.id}
      renderItem={(props) => renderItem({ ...props, width })}
    />
  );
};

const renderItem = ({ item, index, width }) => {
  const isFolder = item['__typename'] == 'Folder';

  return isFolder ? (
    <FlashFolder folder={item} key={item.id} width={width} />
  ) : (
    <FlashFile file={item} key={item.id} width={width} />
  );
};

const FlashFolder = ({ folder, width }) => {
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

const FlashFile = ({ file, width }: { file: File | Image; width: number }) => {
  const { isImage, isVideo } = fileProps(file);
  const { id } = file;
  const [, mutate] = useMutation(addCommentMutation);

  return (
    <AppFileLink file={file} asChild disabled={isVideo}>
      <TouchableOpacity>
        {isImage ? (
          <AspectView ratio={file.imageRatio} width={width}>
            <Suspense fallback={<AppLoadingIndicator />}>
              <AppImage file={file} width={width} />
            </Suspense>
          </AspectView>
        ) : null}
        {isVideo ? (
          <AspectView ratio={file.imageRatio} width={width}>
            <Suspense fallback={<AppLoadingIndicator />}>
              <AppVideo file={file} width={width} />
            </Suspense>
          </AspectView>
        ) : null}
        <View style={styles.fileActions}>
          {/*TODO: HeroImageSet, Info, Download */}
          <PText style={[styles.flashView]}>{file.name}</PText>
          <FileFlagIcon file={file} onChange={(flag) => mutate({ id, flag })} />
          <FileRating
            file={file}
            onChange={(rating) => mutate({ id, rating })}
          />
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
