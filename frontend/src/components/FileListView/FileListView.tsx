import { FileListViewStyleComponentProps } from './FolderContentsView';
import { Page } from '../Page';
import { useCommentPermissions } from '../../hooks/useCommentPermissions';
import { useIsMobile, useIsSmallScreen } from '../../hooks/useIsMobile';
import { useSetFolder } from '../../hooks/useSetFolder';
import { useLazyLoad } from '../../hooks/useLazyLoad';
import { MinimalFile, MinimalFolder } from '../../../types';
import { Group, Rating, Stack, Table, Text } from '@mantine/core';
import { FileFlagBadge } from './Review/FileFlagBadge';
import prettyBytes from 'pretty-bytes';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import { SmallPreview } from './SmallPreview';

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
  const onClick = () => {
    isFolder ? setFolder(file) : setSelectedFileId(file.id);
  };

  const { ref, inView } = useInView({ threshold: 0 });
  useEffect(() => {
    if (inView && onBecomeVisible) {
      onBecomeVisible();
    }
  }, [inView, onBecomeVisible]);

  return (
    <Table.Tr onClick={onClick} style={{ cursor: 'pointer' }} ref={ref}>
      <Table.Td w={100}>
        <SmallPreview file={file} />
      </Table.Td>
      <Table.Td>
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
          </div>
        </Group>
      </Table.Td>
      {canView ? (
        <Table.Td>
          <Stack align="end">
            {file.rating > 0 ? (
              <Rating readOnly value={file.rating} size="xs" />
            ) : null}
            <FileFlagBadge flag={file.flag} />
          </Stack>
        </Table.Td>
      ) : null}
      {!isMobile ? (
        <Table.Td>
          <Text fz="sm" ta="right">
            {file.fileSize ? prettyBytes(file.fileSize) : null}
          </Text>
          <Text fz="xs" ta="right" c="dimmed">
            {file.type ?? 'Folder'}
          </Text>
        </Table.Td>
      ) : null}
      {/*<Table.Td>*/}
      {/*  <Group gap={0} justify="flex-end">*/}
      {/*    <ActionIcon variant="subtle" color="gray">*/}
      {/*      <IconPencil*/}
      {/*        style={{ width: rem(16), height: rem(16) }}*/}
      {/*        stroke={1.5}*/}
      {/*      />*/}
      {/*    </ActionIcon>*/}
      {/*<Menu*/}
      {/*  transitionProps={{ transition: 'pop' }}*/}
      {/*  withArrow*/}
      {/*  position="bottom-end"*/}
      {/*  withinPortal*/}
      {/*>*/}
      {/*  <Menu.Target>*/}
      {/*    <ActionIcon variant="subtle" color="gray">*/}
      {/*      <IconDots style={{ width: rem(16), height: rem(16) }} stroke={1.5} />*/}
      {/*    </ActionIcon>*/}
      {/*  </Menu.Target>*/}
      {/*  <Menu.Dropdown>*/}
      {/*    <Menu.Item*/}
      {/*      leftSection={*/}
      {/*        <IconMessages style={{ width: rem(16), height: rem(16) }} stroke={1.5} />*/}
      {/*      }*/}
      {/*    >*/}
      {/*      Send message*/}
      {/*    </Menu.Item>*/}
      {/*    <Menu.Item*/}
      {/*      leftSection={<IconNote style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}*/}
      {/*    >*/}
      {/*      Add note*/}
      {/*    </Menu.Item>*/}
      {/*    <Menu.Item*/}
      {/*      leftSection={*/}
      {/*        <IconReportAnalytics style={{ width: rem(16), height: rem(16) }} stroke={1.5} />*/}
      {/*      }*/}
      {/*    >*/}
      {/*      Analytics*/}
      {/*    </Menu.Item>*/}
      {/*    <Menu.Item*/}
      {/*      leftSection={<IconTrash style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}*/}
      {/*      color="red"*/}
      {/*    >*/}
      {/*      Terminate contract*/}
      {/*    </Menu.Item>*/}
      {/*  </Menu.Dropdown>*/}
      {/*</Menu>*/}
      {/*</Group>*/}
      {/*</Table.Td>*/}
    </Table.Tr>
  );
};
