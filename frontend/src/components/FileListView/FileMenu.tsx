import type { PicrFile } from '@shared/types/picr';
import { useSetFolder } from '../../hooks/useSetFolder';
import { useCommentPermissions } from '../../hooks/useCommentPermissions';
import {
  useOpenCommentsModal,
  useOpenFileInfoModal,
  useOpenSetBannerImageModal,
} from '../../atoms/modalAtom';
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
import { useMe } from '../../hooks/useMe';
import { useMutation } from 'urql';
import { editFolderMutation } from '@shared/urql/mutations/editFolderMutation';

export const FileMenu = ({ file }: { file: PicrFile }) => {
  const setFolder = useSetFolder();
  const { canView } = useCommentPermissions();
  const me = useMe();
  const [, editFolder] = useMutation(editFolderMutation);
  const openBannerModal = useOpenSetBannerImageModal();

  const openComment = useOpenCommentsModal();
  const openFileInfo = useOpenFileInfoModal();

  return (
    <>
      <Menu.Item
        leftSection={<FileIcon size="20" />}
        key={1}
        onClick={() => {
          if (!file.folderId) return;
          setFolder({ id: file.folderId }, file);
        }}
      >
        View {file.name}
      </Menu.Item>
      <Menu.Item
        leftSection={<InfoIcon size="20" />}
        key={2}
        onClick={() => openFileInfo(file.id)}
      >
        Details
      </Menu.Item>
      {canView ? (
        <Menu.Item
          leftSection={
            file.totalComments == 0 ? <CommentIcon /> : <CommentsIcon />
          }
          key={3}
          onClick={() => openComment(file.id)}
        >
          <Group gap={8}>
            Comments
            <Text c="dimmed" size="xs">
              ({file.totalComments})
            </Text>
          </Group>
        </Menu.Item>
      ) : null}
      {me?.isUser && file.type === 'Image' ? (
        <>
          <Menu.Item
            leftSection={<HeroImageIcon size="20" />}
            key={5}
            disabled={!!file.isHeroImage}
            onClick={() => {
              if (!file.folderId) return;
              editFolder({ folderId: file.folderId, heroImageId: file.id });
            }}
          >
            Set as Hero Image
          </Menu.Item>
          <Menu.Item
            leftSection={<BannerImageIcon size="20" />}
            key={6}
            onClick={() => openBannerModal(file)}
          >
            {file.isBannerImage ? 'Change Banner Size' : 'Set as Banner Image'}
          </Menu.Item>
        </>
      ) : null}
      <Menu.Item
        component="a"
        leftSection={<CloudDownloadIcon />}
        key={4}
        href={imageURL(file, 'raw')}
        download={true}
      >
        Download
      </Menu.Item>
    </>
  );
};
