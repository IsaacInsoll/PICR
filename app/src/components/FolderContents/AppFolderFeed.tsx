import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppFileLink, AppFolderLink } from '@/src/components/AppFolderLink';
import { AppImage } from '@/src/components/AppImage';
import { PText } from '@/src/components/PText';
import { File, FileFlag, Image } from '@shared/gql/graphql';
import { AspectView } from '@/src/components/AspectView';
import { Suspense } from 'react';
import { AppLoadingIndicator } from '@/src/components/AppLoadingIndicator';
import { Rating } from '@kolking/react-native-rating';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { addCommentMutation } from '@shared/urql/mutations/addCommentMutation';
import { useMutation } from 'urql';

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
  const { id } = file;
  const [, mutate] = useMutation(addCommentMutation);

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
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            justifyContent: 'space-between',
            paddingHorizontal: 8,
          }}
        >
          {/* Name, Flags, Thumbs, Comments, HeroImageSet, Info, Download */}
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
});

const FileRating = ({
  file,
  onChange,
}: {
  file: Pick<File, 'rating'>;
  onChange: (rating: number) => void;
}) => {
  const handleChange = (r: number) => {
    return onChange(r == file.rating ? 0 : r);
  };
  return <Rating rating={file.rating} size={16} onChange={handleChange} />;
};

const FileCommentsIcon = ({ file }: { file: Pick<File, 'totalComments'> }) => {
  const theme = useAppTheme();
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 4,
      }}
    >
      <Ionicons
        name={
          file.totalComments == 0
            ? 'chatbubble-outline'
            : 'chatbubble-ellipses-outline'
        }
        size={16}
        color={theme.textColor}
      />
      <PText>{file.totalComments}</PText>
    </View>
  );
};
const FileFlagIcon = ({
  file,
  onChange,
}: {
  file: Pick<File, 'flag'>;
  onChange: (flag?: FileFlag) => void;
}) => {
  const theme = useAppTheme();
  const flag = file.flag;
  const isApproved = flag == 'approved';
  const isRejected = flag == 'rejected';

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
      }}
    >
      <TouchableOpacity
        onPress={() => onChange(!isApproved ? 'approved' : 'none')}
      >
        <Ionicons
          name="thumbs-up-outline"
          size={16}
          color={isApproved ? '#0f0' : theme.dimmedColor}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onChange(!isRejected ? 'rejected' : 'none')}
      >
        <Ionicons
          name="thumbs-down-outline"
          size={16}
          color={isRejected ? '#f00' : theme.dimmedColor}
        />
      </TouchableOpacity>
    </View>
  );
};
