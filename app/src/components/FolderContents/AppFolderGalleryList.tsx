import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppLink } from '@/src/components/AppFolderLink';
import { PText } from '@/src/components/PText';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { BlurView } from 'expo-blur';
import { memo, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import type { AppFolderContentsViewChildProps } from '@/src/components/FolderContents/AppFolderContentsView';
import { PFileView } from '@/src/components/PFileView';
import { AppFooterPadding } from '@/src/components/AppHeaderPadding';
import type {
  FolderContentsItem,
  ViewFolderSubFolder,
} from '@shared/files/folderContentsViewModel';
import { isFolderContentsFile } from '@shared/files/folderContentsViewModel';

const border = 2;
const defaultHeight = 200; //EG: non-images

export const AppFolderGalleryList = ({
  items,
  width,
  refresh,
  colCount,
  ListHeaderComponent,
}: AppFolderContentsViewChildProps & { colCount: number }) => {
  // I was using `useScreenOrientation` but it casued more rerenders when rotating device between portrait/landscape
  // this current onLayout/setState implementation is less glitchy feeling
  const [isLandscape, setIsLandscape] = useState(false);
  const cols = isLandscape ? colCount * 2 : colCount;
  const theme = useAppTheme();

  return (
    <FlashList
      onRefresh={refresh}
      onLayout={(e) => {
        const layout = e.nativeEvent.layout;
        const arl = layout.width / layout.height > 1.0;
        if (arl !== isLandscape) setIsLandscape(arl);
      }}
      masonry={true}
      style={{ flex: 1, width: '100%', flexGrow: 1 }}
      data={items}
      numColumns={cols}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={<AppFooterPadding />}
      keyExtractor={(item) => item.__typename + item.id}
      renderItem={(props) => (
        <MasonryItem
          {...props}
          width={width}
          colCount={cols}
          borderColor={theme.backgroundColor}
        />
      )}
    />
  );
};

const MasonryItemComponent = ({
  item,
  width,
  colCount,
  borderColor,
}: {
  item: FolderContentsItem;
  width: number;
  colCount: number;
  borderColor: string;
}) => {
  const isFolder = !isFolderContentsFile(item);
  const folder = isFolder ? item : null;
  const file = !isFolder ? item : null;
  const image =
    folder?.heroImage ??
    (file && file.__typename !== 'File' ? file : undefined);
  const canRenderMedia =
    file?.__typename === 'Image' ||
    file?.__typename === 'Video' ||
    folder?.heroImage != null;

  const style = {
    width: width / colCount - border * 2,
    height: image?.imageRatio
      ? width / colCount / image.imageRatio
      : defaultHeight,
  };

  return (
    <View style={[styles.imageContainer, { borderColor }]}>
      <AppLink item={item} asChild={true}>
        <TouchableOpacity>
          {canRenderMedia && image ? (
            <PFileView
              file={image}
              size="md"
              style={style}
              transition={100}
              // onDisplay={() => setImagesLoaded((l) => l + 1)}
              // blurRadius={isFolder ? 0 : undefined}
            />
          ) : (
            <PFileView
              file={item}
              size="md"
              style={{ height: width / colCount }}
            />
          )}
          {folder ? <FolderName folder={folder} intensity={colCount} /> : null}
        </TouchableOpacity>
      </AppLink>
    </View>
  );
};

const MasonryItem = memo(MasonryItemComponent);
MasonryItem.displayName = 'MasonryItem';

const FolderName = ({
  folder,
  intensity,
}: {
  folder: ViewFolderSubFolder;
  intensity: number;
}) => {
  //this blur doesn't always render (EG: toggle from 2 column to 3 column and it disappears for most items
  // so i'm adding a background color as well, just in case
  const theme = useAppTheme();
  return (
    <BlurView
      intensity={intensity}
      // tint="dark"
      experimentalBlurMethod="dimezisBlurView"
      style={{
        position: 'absolute',
        // bottom: safe.bottom,
        bottom: 0,
        left: 0,
        right: 0,
        // padding: 16,
        backgroundColor: theme.backgroundColor + '80',
      }}
    >
      <PText
        style={{
          // backgroundColor: '#80808080',
          padding: 8,
          textAlign: 'center',
        }}
      >
        {folder.name}
      </PText>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  imageContainer: {
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: border,
    // borderColor: '#fff',
  },
});
