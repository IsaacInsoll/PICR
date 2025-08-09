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

// inspired by https://github.com/shevon14/react-native-masonry-gallery/ which doesn't have NPM package and is super simple

const border = 2;
const defaultHeight = 200; //EG: non-images

export const AppFolderGalleryList = ({ items, width, colCount }) => {
  const columns = useMemo(() => {
    console.log('calculating columns');
    return splitImages(items, colCount);
  }, [items, colCount]);

  // it's a bit slow to load all images at once and you get notable column-by-column rendering
  // so lets start with rendering the tops of each row and then continue rendering down
  // literally as soon as i did this the user experience felt 10x better
  const [imagesLoaded, setImagesLoaded] = useState(0);
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {columns.map((column, index) => (
        <View key={index}>
          {column.map((image, imageIndex) => {
            // see images loaded for why we are 'rolling out' rather than insta-loading
            if (imageIndex > imagesLoaded / colCount + 2) return null;

            const isFolder = image.__typename == 'Folder';
            return (
              <View key={image.id} style={styles.imageContainer}>
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
                      onDisplay={() => setImagesLoaded((l) => l + 1)}
                      // blurRadius={isFolder ? 0 : undefined}
                    />
                    {isFolder ? (
                      <FolderName folder={image} intensity={colCount} />
                    ) : null}
                  </TouchableOpacity>
                </AppLink>
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
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
