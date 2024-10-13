import { MinimalFile } from '../../../types';
import { useSetFolder } from '../../hooks/useSetFolder';
import { useCommentPermissions } from '../../hooks/useCommentPermissions';
import {
  useOpenCommentsModal,
  useOpenFileInfoModal,
} from '../../atoms/modalAtom';
import { Group, Menu, Text } from '@mantine/core';
import { TbCloudDownload, TbFile, TbInfoCircle } from 'react-icons/tb';
import { BiComment, BiCommentDetail } from 'react-icons/bi';
import { imageURL } from '../../helpers/imageURL';

export const FileMenu = ({ file }: { file: MinimalFile }) => {
  const setFolder = useSetFolder();
  const { canView } = useCommentPermissions();

  const openComment = useOpenCommentsModal();
  const openFileInfo = useOpenFileInfoModal();

  return (
    <>
      <Menu.Item
        leftSection={<TbFile size="20" />}
        key={1}
        onClick={() => {
          setFolder({ id: file.folderId }, file);
        }}
      >
        View {file.name}
      </Menu.Item>
      <Menu.Item
        leftSection={<TbInfoCircle size="20" />}
        key={2}
        onClick={() => openFileInfo(file)}
      >
        Details
      </Menu.Item>
      {canView ? (
        <Menu.Item
          leftSection={
            file.totalComments == 0 ? <BiComment /> : <BiCommentDetail />
          }
          key={3}
          onClick={() => openComment(file)}
        >
          <Group gap={8}>
            Comments
            <Text c="dimmed" size="xs">
              ({file.totalComments})
            </Text>
          </Group>
        </Menu.Item>
      ) : null}
      <Menu.Item
        component="a"
        leftSection={<TbCloudDownload />}
        key={4}
        href={imageURL(file, 'raw')}
        download={true}
      >
        Download
      </Menu.Item>
    </>
  );
};
