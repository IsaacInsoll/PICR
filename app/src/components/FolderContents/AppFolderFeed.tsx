import { FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { AppFileLink, AppFolderLink } from '@/src/components/AppFolderLink';
import { AppImage } from '@/src/components/AppImage';
import { PText } from '@/src/components/PText';
import { File, Image } from '@shared/gql/graphql';
import { AspectView } from '@/src/components/AspectView';
import { Suspense } from 'react';
import { AppLoadingIndicator } from '@/src/components/AppLoadingIndicator';

export const AppFolderFeed = ({ items, width }) => {
  return (
    <FlatList
      style={{ flex: 1, width: '100%', flexGrow: 1 }}
      data={items}
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
      <TouchableOpacity
      // onPress={() => {
      //   router.navigate('./' + folder.id, { withAnchor: true });
      // }}
      >
        {folder.heroImage?.id ? (
          <AppImage file={folder.heroImage} width={width} />
        ) : null}
        <PText style={[styles.flashView]}>
          {folder.id} {folder.name}
        </PText>
      </TouchableOpacity>
    </AppFolderLink>
  );
};

const FlashFile = ({ file, width }: { file: File | Image; width: number }) => {
  const isImage = file.type == 'Image';

  return (
    <AppFileLink file={file} asChild>
      <TouchableOpacity>
        {isImage ? (
          <AspectView ratio={file.imageRatio} width={width}>
            <Suspense fallback={<AppLoadingIndicator />}>
              <AppImage file={file} />
            </Suspense>
          </AspectView>
        ) : null}
        <PText style={[styles.flashView]}>
          {/* Name, Flags, Thumbs, Comments, HeroImageSet, Info, Download */}
          {file.name} / Flag: {file.flag ?? 'none'} / {file.rating} Stars /{' '}
          {file.totalComments} comments
        </PText>
      </TouchableOpacity>
    </AppFileLink>
  );
};

const styles = StyleSheet.create({
  flashView: {
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
});
