import { MinimalFile, MinimalFolder } from '../../../types';
import { useSetFolder } from '../../hooks/useSetFolder';
import { useCommentPermissions } from '../../hooks/useCommentPermissions';
import {
  useOpenCommentsModal,
  useOpenFileInfoModal,
} from '../../atoms/modalAtom';
import { Group, Menu, Text } from '@mantine/core';
import { TbCloudDownload, TbFile } from 'react-icons/tb';
import { BiComment, BiCommentDetail } from 'react-icons/bi';
import { imageURL } from '../../helpers/imageURL';
import { DownloadIcon, FolderIcon, InfoIcon } from '../../PicrIcons';
import { useMutation } from 'urql';
import { generateZipMutation } from '../../urql/mutations/generateZipMutation';
import { useGenerateZip } from '../../hooks/useGenerateZip';

export const FolderMenu = ({ folder }: { folder: MinimalFolder }) => {
  const setFolder = useSetFolder();
  const generateZip = useGenerateZip(folder);

  //TODO: Manage

  return (
    <>
      <Menu.Item
        leftSection={<FolderIcon size="20" />}
        key={1}
        onClick={() => {
          setFolder(folder);
        }}
      >
        Open {folder.name}
      </Menu.Item>
      {/*{canView ? (*/}
      {/*  <Menu.Item*/}
      {/*    leftSection={*/}
      {/*      file.totalComments == 0 ? <BiComment /> : <BiCommentDetail />*/}
      {/*    }*/}
      {/*    key={3}*/}
      {/*    onClick={() => openComment(file)}*/}
      {/*  >*/}
      {/*    <Group gap={8}>*/}
      {/*      Comments*/}
      {/*      <Text c="dimmed" size="xs">*/}
      {/*        ({file.totalComments})*/}
      {/*      </Text>*/}
      {/*    </Group>*/}
      {/*  </Menu.Item>*/}
      {/*) : null}*/}
      <Menu.Item leftSection={<DownloadIcon />} key={4} onClick={generateZip}>
        Download
      </Menu.Item>
    </>
  );
};
