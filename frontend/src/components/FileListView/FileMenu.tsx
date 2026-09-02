import type { PicrFile } from '@shared/types/picr';
import { normalizeDisplayName } from '@shared/displayName';
import { useSelectedFileId } from '../../hooks/useSelectedFileId';
import { useCommentPermissions } from '../../hooks/useCommentPermissions';
import { useOpenSetBannerImageModal } from '../../atoms/modalAtom';
import {
  useOpenCommentsModal,
  useOpenFileInfoModal,
} from '../../hooks/useFileModalNavigation';
import { Group, Menu, Text } from '@mantine/core';
import { imageURL } from '../../helpers/imageURL';
import {
  BannerImageIcon,
  CloudDownloadIcon,
  CommentIcon,
  CommentsIcon,
  FileIcon,
  HeroImageIcon,
  InfoIcon,
} from '../../PicrIcons';
import { useCanDownload, useMe } from '../../hooks/useMe';
import {
  canUseShareSheet,
  isShareableMediaFile,
  shareOrDownload,
} from '../../helpers/shareOrDownload';
import { useMutation } from 'urql';
import { editFolderMutation } from '@shared/urql/mutations/editFolderMutation';
import { useTranslation } from 'react-i18next';

export const FileMenu = ({ file }: { file: PicrFile }) => {
  const { t } = useTranslation(['gallery', 'admin']);
  const fileName = normalizeDisplayName(file.name);
  const setSelectedFileId = useSelectedFileId(file.folderId ?? '');
  const { canView } = useCommentPermissions();
  const canDownload = useCanDownload();
  const me = useMe();
  const [, editFolder] = useMutation(editFolderMutation);
  const openBannerModal = useOpenSetBannerImageModal();

  const openComment = useOpenCommentsModal();
  const openFileInfo = useOpenFileInfoModal();
  const canSetHero = file.type === 'Image' || file.type === 'Video';
  const canSetBanner = file.type === 'Image';

  return (
    <>
      <Menu.Item
        leftSection={<FileIcon size="20" />}
        key={1}
        onClick={() => {
          if (!file.folderId) return;
          setSelectedFileId(file.id);
        }}
      >
        {t('file.view', { name: fileName })}
      </Menu.Item>
      <Menu.Item
        leftSection={<InfoIcon size="20" />}
        key={2}
        onClick={() => openFileInfo(file.id)}
      >
        {t('file.details')}
      </Menu.Item>
      {canView ? (
        <Menu.Item
          leftSection={
            file.totalComments === 0 ? <CommentIcon /> : <CommentsIcon />
          }
          key={3}
          onClick={() => openComment(file.id)}
        >
          <Group gap={8}>
            {t('file.comments')}
            <Text c="dimmed" size="xs">
              ({file.totalComments})
            </Text>
          </Group>
        </Menu.Item>
      ) : null}
      {me?.isUser && canSetHero ? (
        <>
          <Menu.Item
            leftSection={<HeroImageIcon size="20" />}
            key={5}
            disabled={!!file.isHeroImage}
            onClick={() => {
              if (!file.folderId) return;
              void editFolder({
                folderId: file.folderId,
                heroImageId: file.id,
              });
            }}
          >
            {t('folder.banner.setHero', { ns: 'admin' })}
          </Menu.Item>
          {canSetBanner ? (
            <Menu.Item
              leftSection={<BannerImageIcon size="20" />}
              key={6}
              onClick={() => openBannerModal(file)}
            >
              {file.isBannerImage
                ? t('folder.banner.changeSize', { ns: 'admin' })
                : t('folder.banner.setImage', { ns: 'admin' })}
            </Menu.Item>
          ) : null}
        </>
      ) : null}
      {canDownload ? (
        <Menu.Item
          component="a"
          leftSection={<CloudDownloadIcon />}
          key={4}
          href={imageURL(file, 'raw')}
          download={true}
          onClick={(e) => {
            // On iOS, use the native share sheet ("Save to Photos") for media instead
            // of the anchor download (which opens "Save to Files").
            if (isShareableMediaFile(file) && canUseShareSheet()) {
              e.preventDefault();
              void shareOrDownload(imageURL(file, 'raw'), file.name ?? '', t);
            }
          }}
        >
          {t('download.button')}
        </Menu.Item>
      ) : null}
    </>
  );
};
