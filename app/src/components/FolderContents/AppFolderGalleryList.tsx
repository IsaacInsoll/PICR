import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppFolderLink, AppLink } from '@/src/components/AppFolderLink';
import { AppImage } from '@/src/components/AppImage';
import { PText } from '@/src/components/PText';
import { File, Folder, Image } from '@shared/gql/graphql';
import { AspectView } from '@/src/components/AspectView';
import { AppLoadingIndicator } from '@/src/components/AppLoadingIndicator';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { addCommentMutation } from '@shared/urql/mutations/addCommentMutation';
import { FileCommentsIcon } from '@/src/components/FolderContents/FileCommentsIcon';
import { FileFlagIcon } from '@/src/components/FolderContents/FileFlagIcon';
import { FileRating } from '@/src/components/FolderContents/FileRating';
import { PTitle } from '@/src/components/PTitle';
import { PFileImage } from '@/src/components/PFileImage';
import { AppFileFlagChip } from '@/src/components/chips/AppFileFlagChip';
import { AppFileRatingChip } from '@/src/components/chips/AppFileRatingChip';
import { AppCommentsChip } from '@/src/components/chips/AppCommentsChip';
import { BlurView } from 'expo-blur';
import { useMemo, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import { useScreenOrientation } from '@/src/hooks/useScreenOrientation';
import { AppFolderContentsViewChildProps } from '@/src/components/FolderContents/AppFolderContentsView';

const border = 2;
const defaultHeight = 200; //EG: non-images

export const AppFolderGalleryList = ({
  items,
  width,
  refresh,
  colCount,
}: AppFolderContentsViewChildProps & { colCount: number }) => {
  // I was using `useScreenOrientation` but it casued more rerenders when rotating device between portrait/landscape
  // this current onLayout/setState implementation is less glitchy feeling
  const [isLandscape, setIsLandscape] = useState(false);
  const cols = isLandscape ? colCount * 2 : colCount;
  return (
    <FlashList
      onRefresh={refresh}
      onLayout={(e) => {
        const layout = e.nativeEvent.layout;
        const arl = layout.width / layout.height > 1.0;
        if (arl != isLandscape) setIsLandscape(arl);
      }}
      masonry={true}
      style={{ flex: 1, width: '100%', flexGrow: 1 }}
      data={items}
      numColumns={cols}
      keyExtractor={(item) => item['__typename'] + item.id}
      renderItem={(props) => (
        <MasonryItem {...props} width={width} colCount={cols} />
      )}
    />
  );
};

const MasonryItem = ({ item, width, colCount }) => {
  const image = item;
  const isFolder = image.__typename == 'Folder';
  return (
    <View style={styles.imageContainer}>
      <AppLink item={image} asChild={true}>
        <TouchableOpacity>
          <PFileImage
            file={isFolder ? image.heroImage : image}
            size="md"
            style={{
              width: width / colCount - border * 2,
              height: image.imageRatio
                ? width / colCount / image.imageRatio
                : defaultHeight,
            }}
            transition={100}
            // onDisplay={() => setImagesLoaded((l) => l + 1)}
            // blurRadius={isFolder ? 0 : undefined}
          />
          {isFolder ? <FolderName folder={image} intensity={colCount} /> : null}
        </TouchableOpacity>
      </AppLink>
    </View>
  );
};

const FolderName = ({
  folder,
  intensity,
}: {
  folder: Folder;
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
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: border,
    // borderColor: '#fff',
  },
});

const splitImages = (images: (File | Image)[], numCols: number = 2) => {
  const heights = Array(numCols).fill(0);
  // couldn't use array.fill because all values were pointing to same array :/
  const cols = heights.map((h) => []);

  images.forEach((image) => {
    const height = defaultHeight / (image.imageRatio ?? 1); //non-image stuff can just be 100 high?
    const shortestColHeight = Math.min(...heights);
    const shortestCol = heights.findIndex((x) => x == shortestColHeight);
    cols[shortestCol].push(image);
    heights[shortestCol] += height;
  });
  return cols;
};
