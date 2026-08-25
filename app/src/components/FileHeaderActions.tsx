import { Alert, View } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { HeaderButton } from '@react-navigation/elements';
import { Ionicons } from '@expo/vector-icons';
import type { ViewFolderFile } from '@shared/files/sortFiles';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useLocalImageUrl } from '@/src/components/PBigImage';
import { navBarIconProps } from '@/src/constants';

type FileHeaderActionsFile = Pick<
  ViewFolderFile,
  'id' | 'fileHash' | 'name' | 'type' | 'totalComments'
>;

export const FileHeaderActions = ({
  file,
  onDownload,
  onComments,
  onInfo,
}: {
  file: FileHeaderActionsFile;
  onDownload: () => void;
  onComments: () => void;
  onInfo: () => void;
}) => {
  const theme = useAppTheme();
  const uri = useLocalImageUrl(file, 'raw');

  const download = async () => {
    onDownload();
    if (!uri) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Media library access is needed to perform this action.',
        );
        return;
      }

      await MediaLibrary.createAssetAsync(uri);
    } catch {
      // Phase 3 will replace the existing silent failure with user feedback.
    }
  };

  return (
    <View style={{ flexDirection: 'row' }}>
      <HeaderButton
        accessibilityLabel="Download file"
        testID="file-download-button"
        onPress={() => void download()}
      >
        <Ionicons
          name="download"
          size={25}
          color={theme.brandColor}
          style={navBarIconProps}
        />
      </HeaderButton>
      <HeaderButton
        accessibilityLabel="View comments"
        testID="file-comments-button"
        onPress={onComments}
      >
        <Ionicons
          name={
            file.totalComments && file.totalComments > 0
              ? 'chatbox-ellipses-outline'
              : 'chatbox-outline'
          }
          size={25}
          color={theme.brandColor}
          style={navBarIconProps}
        />
      </HeaderButton>
      <HeaderButton
        accessibilityLabel="View file information"
        testID="file-info-button"
        onPress={onInfo}
      >
        <Ionicons
          name="information-circle-outline"
          size={25}
          color={theme.brandColor}
          style={navBarIconProps}
        />
      </HeaderButton>
    </View>
  );
};
