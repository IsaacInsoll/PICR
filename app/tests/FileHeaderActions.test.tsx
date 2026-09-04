import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import * as MediaLibrary from 'expo-media-library';
import { FileHeaderActions } from '@/src/components/FileHeaderActions';
import { FileType } from '@shared/gql/graphql';
import { NavigationContainer } from 'expo-router/react-navigation';
import { Alert } from 'react-native';

const localUri = 'file:///tmp/photo.jpg';

jest.mock('@/src/hooks/useAppTheme', () => ({
  useAppTheme: () => ({ brandColor: '#123456' }),
}));

jest.mock('@/src/components/PBigImage', () => ({
  useLocalImageUrl: () => localUri,
}));

jest.mock('expo-media-library', () => ({
  createAssetAsync: jest.fn(),
  PermissionStatus: { GRANTED: 'granted' },
  requestPermissionsAsync: jest.fn(),
}));

const file = {
  id: '42',
  fileHash: 'hash',
  name: 'photo.jpg',
  type: FileType.Image,
  totalComments: 1,
};

describe('FileHeaderActions', () => {
  beforeEach(() => {
    jest.mocked(MediaLibrary.createAssetAsync).mockReset();
    jest.mocked(MediaLibrary.requestPermissionsAsync).mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows the photographer download, comment and info actions', async () => {
    await render(
      <NavigationContainer>
        <FileHeaderActions
          file={file}
          onDownload={jest.fn()}
          onComments={jest.fn()}
          onInfo={jest.fn()}
        />
      </NavigationContainer>,
    );

    expect(screen.getByTestId('file-download-button')).toBeOnTheScreen();
    expect(screen.getByTestId('file-comments-button')).toBeOnTheScreen();
    expect(screen.getByTestId('file-info-button')).toBeOnTheScreen();
  });

  it('runs the action callbacks and saves a permitted download', async () => {
    jest.mocked(MediaLibrary.requestPermissionsAsync).mockResolvedValue({
      status: MediaLibrary.PermissionStatus.GRANTED,
      canAskAgain: true,
      expires: 'never',
      granted: true,
    });
    jest.mocked(MediaLibrary.createAssetAsync).mockResolvedValue({
      id: 'asset',
      filename: 'photo.jpg',
      uri: localUri,
      mediaType: 'photo',
      width: 100,
      height: 100,
      creationTime: 0,
      modificationTime: 0,
      duration: 0,
    });
    const onDownload = jest.fn();
    const onComments = jest.fn();
    const onInfo = jest.fn();

    await render(
      <NavigationContainer>
        <FileHeaderActions
          file={file}
          onDownload={onDownload}
          onComments={onComments}
          onInfo={onInfo}
        />
      </NavigationContainer>,
    );

    await fireEvent.press(screen.getByTestId('file-download-button'));
    await fireEvent.press(screen.getByTestId('file-comments-button'));
    await fireEvent.press(screen.getByTestId('file-info-button'));

    await waitFor(() => {
      expect(MediaLibrary.createAssetAsync).toHaveBeenCalledWith(localUri);
      expect(screen.getByTestId('file-download-succeeded')).toBeOnTheScreen();
    });
    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(onComments).toHaveBeenCalledTimes(1);
    expect(onInfo).toHaveBeenCalledTimes(1);
  });

  it('shows a useful error when the file cannot be saved', async () => {
    jest.mocked(MediaLibrary.requestPermissionsAsync).mockResolvedValue({
      status: MediaLibrary.PermissionStatus.GRANTED,
      canAskAgain: true,
      expires: 'never',
      granted: true,
    });
    jest
      .mocked(MediaLibrary.createAssetAsync)
      .mockRejectedValue(new Error('save failed'));
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    await render(
      <NavigationContainer>
        <FileHeaderActions
          file={file}
          onDownload={jest.fn()}
          onComments={jest.fn()}
          onInfo={jest.fn()}
        />
      </NavigationContainer>,
    );

    await fireEvent.press(screen.getByTestId('file-download-button'));

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith(
        'Download failed',
        'PICR could not save this file. Please try again.',
      );
      expect(screen.getByTestId('file-download-button')).toBeOnTheScreen();
    });
  });
});
