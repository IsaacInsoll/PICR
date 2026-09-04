import { Alert, View } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { HeaderButton } from 'expo-router/react-navigation';
import { Ionicons } from '@expo/vector-icons';
import type { ViewFolderFile } from '@shared/files/sortFiles';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useLocalImageUrl } from '@/src/components/PBigImage';
import { navBarIconProps } from '@/src/constants';
import { useState } from 'react';

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
  const [downloadProgress, setDownloadProgress] = useState<{
    fileId: string;
    state: 'idle' | 'saving' | 'saved';
  }>({ fileId: file.id, state: 'idle' });
  const downloadState =
    downloadProgress.fileId === file.id ? downloadProgress.state : 'idle';
  const setDownloadState = (state: 'idle' | 'saving' | 'saved') =>
    setDownloadProgress({ fileId: file.id, state });

  const download = async () => {
    onDownload();
    if (!uri) return;

    setDownloadState('saving');
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        setDownloadState('idle');
        Alert.alert(
          'Permission required',
          'Media library access is needed to perform this action.',
        );
        return;
      }

      await MediaLibrary.createAssetAsync(uri);
      setDownloadState('saved');
    } catch {
      setDownloadState('idle');
      Alert.alert(
        'Download failed',
        'PICR could not save this file. Please try again.',
      );
    }
  };

  return (
    <View style={{ flexDirection: 'row' }}>
      <HeaderButton
        accessibilityLabel={
          downloadState === 'saved' ? 'Download complete' : 'Download file'
        }
        testID={
          downloadState === 'saved'
            ? 'file-download-succeeded'
            : downloadState === 'saving'
              ? 'file-download-saving'
              : 'file-download-button'
        }
        disabled={downloadState === 'saving'}
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
