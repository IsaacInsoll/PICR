import { Button, Divider, Group, Stack, Text } from '@mantine/core';
import type { PicrFile, PicrFolder } from '@shared/types/picr';
import { NavLink, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useBaseViewFolderURL } from '../../hooks/useBaseViewFolderURL';
import { FolderOpenIcon, PhotoViewIcon } from '../../PicrIcons';
import { PicrLink } from '../PicrLink';
import { PrettyFolderPath } from '../PrettyFolderPath';
import { FilePreview } from './FilePreview';
import { useIsSmallScreen } from '../../hooks/useIsMobile';
import { folderIdFromPath } from '../../helpers/folderRoutes';
import { withFileModalState } from '../../helpers/fileModalHash';

export const FileModalFileContext = ({
  file,
  folder,
  showPreview = true,
}: {
  file: PicrFile;
  folder?: PicrFolder;
  showPreview?: boolean;
}) => {
  const { t } = useTranslation('gallery');
  const location = useLocation();
  const isMobile = useIsSmallScreen();
  const baseFolderUrl = useBaseViewFolderURL();
  const folderId = file.folderId;
  const folderUrl = folderId ? `${baseFolderUrl}${folderId}` : undefined;
  const fileUrl = folderUrl ? `${folderUrl}/${file.id}` : undefined;
  const destinationHash = withFileModalState(location.hash);
  const folderLocation = folderUrl
    ? { pathname: folderUrl, hash: destinationHash }
    : undefined;
  const fileLocation = fileUrl
    ? { pathname: fileUrl, hash: destinationHash }
    : undefined;
  const currentFolderId = folderIdFromPath(location.pathname);
  const showLocation = folderId ? currentFolderId !== folderId : false;

  // These file links only render when the owning folder is not the current
  // route. Leave them unmarked so closing the lightbox replaces it with the
  // owning folder instead of popping back to the modal as though that folder
  // listing were already behind it.

  return (
    <Stack gap="xs">
      {showLocation && folderLocation && fileLocation ? (
        <>
          {folder ? (
            <>
              <Text size="xs" c="dimmed" fw={500}>
                {t('comments.gallery')}
              </Text>
              <PicrLink to={folderLocation} underline="never">
                <PrettyFolderPath folder={folder} />
              </PicrLink>
            </>
          ) : null}
          <Group grow={isMobile} wrap="wrap">
            <Button
              component={NavLink}
              to={folderLocation}
              variant="default"
              leftSection={<FolderOpenIcon />}
            >
              {t('comments.openGallery')}
            </Button>
            <Button
              component={NavLink}
              to={fileLocation}
              leftSection={<PhotoViewIcon />}
            >
              {t('comments.viewFile')}
            </Button>
          </Group>
          <Divider />
        </>
      ) : null}
      {showPreview ? (
        showLocation && fileLocation ? (
          <PicrLink to={fileLocation}>
            <FilePreview file={file} />
          </PicrLink>
        ) : (
          <FilePreview file={file} clickable={false} />
        )
      ) : null}
    </Stack>
  );
};
