import {
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AppFileLink,
  AppFolderLink,
  AppLink,
} from '@/src/components/AppFolderLink';
import { AppImage } from '@/src/components/AppImage';
import { PText } from '@/src/components/PText';
import { File, Image } from '@shared/gql/graphql';
import { AspectView } from '@/src/components/AspectView';
import { Suspense } from 'react';
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

// inspired by https://github.com/shevon14/react-native-masonry-gallery/ which doesn't have NPM package and is super simple

const border = 2;

export const AppFolderGalleryList = ({ items, width, colCount }) => {
  const columns = splitImages(items, colCount);
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {columns.map((column, index) => (
        <View key={index}>
          {column.map((image) => (
            <View key={image.id} style={styles.imageContainer}>
              <AppFileLink file={image} asChild={true}>
                <TouchableOpacity>
                  <PFileImage
                    file={image}
                    size="md"
                    style={{
                      width: width / colCount - border * 2,
                      height: width / colCount / image.imageRatio,
                    }}
                  />
                </TouchableOpacity>
              </AppFileLink>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
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

  console.log('processingimage');
  images.forEach((image) => {
    const height = 200 / (image.imageRatio ?? 1); //non-image stuff can just be 100 high?
    const shortestColHeight = Math.min(...heights);
    const shortestCol = heights.findIndex((x) => x == shortestColHeight);
    console.log(shortestColHeight, shortestCol, cols[0].length, cols[1].length);
    cols[shortestCol].push(image);
    heights[shortestCol] += height;
  });
  return cols;
};
