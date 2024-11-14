import { FileListViewStyleComponentProps } from './FolderContentsView';
import { Page } from '../Page';
import { useCommentPermissions } from '../../hooks/useCommentPermissions';
import { useIsMobile, useIsSmallScreen } from '../../hooks/useIsMobile';
import { useSetFolder } from '../../hooks/useSetFolder';
import { useLazyLoad } from '../../hooks/useLazyLoad';
import { MinimalFile, MinimalFolder } from '../../../types';
import {
  ActionIcon,
  Group,
  Menu,
  Rating,
  rem,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { FileFlagBadge } from './Review/FileFlagBadge';
import prettyBytes from 'pretty-bytes';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import { SmallPreview } from './SmallPreview';
import { pluralize } from '../../helpers/folderSubtitle';
import { TbDots } from 'react-icons/tb';
import { FileMenu } from './FileMenu';
import { fileFlagStyles } from './Review/fileFlagStyles';

export const FileListView = ({
  files,
  setSelectedFileId,
  folders,
}: FileListViewStyleComponentProps) => {
  const { canView, isNone } = useCommentPermissions();
  const setFolder = useSetFolder();

  const [lazyLoaded, onBecomeVisible] = useLazyLoad(100, files.length);
  const loadedFiles = [...folders, ...files].slice(0, lazyLoaded);

  return (
    <Page style={{}}>
      <Table highlightOnHover>
        <Table.Tbody>
          {loadedFiles?.map((f, i) => (
            <Row
              file={f}
              key={f.id}
              setSelectedFileId={setSelectedFileId}
              onBecomeVisible={() => onBecomeVisible(i)}
            />
          ))}
        </Table.Tbody>
      </Table>
    </Page>
  );
};

const Row = ({
  setSelectedFileId,
  file,
  onBecomeVisible,
}: {
  file: MinimalFile | MinimalFolder;
  onBecomeVisible: () => void;
}) => {
  const { canView, isNone } = useCommentPermissions();
  const setFolder = useSetFolder();
  const isMobile = useIsMobile();
  const isSmall = useIsSmallScreen();

  const isFolder = file.__typename == 'Folder';
  const onClick = (e) => {
    console.log(e.target);
    isFolder ? setFolder(file) : setSelectedFileId(file.id);
  };

  const { ref, inView } = useInView({ threshold: 0 });
  useEffect(() => {
    if (inView && onBecomeVisible) {
      onBecomeVisible();
    }
  }, [inView, onBecomeVisible]);

  return (
    <Table.Tr style={{ cursor: 'pointer' }} ref={ref}>
      <Table.Td w={100} onClick={onClick}>
        <SmallPreview file={file} />
      </Table.Td>
      <Table.Td onClick={onClick}>
        <Group gap="sm">
          {/*<Avatar size={40} src={item.avatar} radius={40} />*/}
          <div>
            <Text fz="md" fw={500}>
              {file.name}
            </Text>
            {/*{isMobile ? (*/}
            {/*  <Text c="dimmed" fz="xs">*/}
            {/*    {file.type ?? 'Folder'}{' '}*/}
            {/*    {file.fileSize ? ', ' + prettyBytes(file.fileSize) : null}*/}
            {/*  </Text>*/}
            {/*) : null}*/}
            {canView ? (
              <Group gap="xs" align="center">
                {isMobile && file.flag && file.flag != 'None'
                  ? fileFlagStyles[file.flag].icon
                  : null}
                {isMobile && file.rating ? (
                  <Text c="dimmed" fz="xs">
                    {pluralize(file.rating, 'Star')}
                    {/*{file.fileSize ? ', ' + prettyBytes(file.fileSize) : null}*/}
                  </Text>
                ) : null}
                {file.totalComments ? (
                  <Text c="dimmed" fz="xs">
                    {pluralize(file.totalComments, 'Comment')}
                    {/*{file.fileSize ? ', ' + prettyBytes(file.fileSize) : null}*/}
                  </Text>
                ) : null}
              </Group>
            ) : null}
          </div>
        </Group>
      </Table.Td>
      {canView && !isMobile ? (
        <Table.Td onClick={onClick}>
          <Stack align="end">
            {file.rating > 0 ? (
              <Rating readOnly value={file.rating} size="xs" />
            ) : null}
            <FileFlagBadge flag={file.flag} />
          </Stack>
        </Table.Td>
      ) : null}
      {!isMobile ? (
        <Table.Td onClick={onClick}>
          <Text fz="sm" ta="right">
            {file.fileSize ? prettyBytes(file.fileSize) : null}
          </Text>
          <Text fz="xs" ta="right" c="dimmed">
            {file.type ?? 'Folder'}
          </Text>
        </Table.Td>
      ) : null}
      <Table.Td>
        <Group gap={0} justify="flex-end">
          {/*    <ActionIcon variant="subtle" color="gray">*/}
          {/*      <IconPencil*/}
          {/*        style={{ width: rem(16), height: rem(16) }}*/}
          {/*        stroke={1.5}*/}
          {/*      />*/}
          {/*    </ActionIcon>*/}
          <Menu
            transitionProps={{ transition: 'pop' }}
            withArrow
            position="bottom-end"
            withinPortal
          >
            <Menu.Target>
              <ActionIcon variant="light" color="gray">
                <TbDots />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <FileMenu file={file} />
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
};
