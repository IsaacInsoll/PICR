import { FileListViewStyleComponentProps } from './FolderContentsView';
import { Page } from '../Page';
import { useCommentPermissions } from '../../hooks/useCommentPermissions';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useSetFolder } from '../../hooks/useSetFolder';
import { useLazyLoad } from '../../hooks/useLazyLoad';
import { FolderContentsItem } from '@shared/files/folderContentsViewModel';
import {
  ActionIcon,
  Avatar,
  Badge,
  Group,
  Menu,
  Rating,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { FileFlagBadge } from './Review/FileFlagBadge';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import { SmallPreview } from './SmallPreview';
import { FileMenu } from './FileMenu';
import { fileFlagStyles } from './Review/fileFlagStyles';
import { fileSortAtom } from '../../atoms/fileSortAtom';
import { useAtomValue } from 'jotai';
import { DotsIcon } from '../../PicrIcons';
import { FolderMenu } from './FolderMenu';
import { PicrAvatar } from '../PicrAvatar';
import { prettyBytes } from '@shared/prettyBytes';
import { pluralize } from '@shared/pluralize';
import { prettyDate } from '@shared/prettyDate';

export const FileListView = ({
  files,
  setSelectedFileId,
  folders,
  items,
}: FileListViewStyleComponentProps) => {
  const orderedItems = items ?? [...folders, ...files];

  const [lazyLoaded, onBecomeVisible] = useLazyLoad(100, orderedItems.length);
  const loadedFiles = orderedItems.slice(0, lazyLoaded);

  return (
    <Page style={{}}>
      <Table highlightOnHover>
        <Table.Tbody>
          {loadedFiles.map((f, i) => (
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
  file: FolderContentsItem;
  onBecomeVisible: () => void;
}) => {
  const { canView } = useCommentPermissions();
  const setFolder = useSetFolder();
  const isMobile = useIsMobile();
  const isFolder = file.__typename == 'Folder';
  const modifiedDate = isFolder
    ? file.folderLastModified
    : file.fileLastModified;

  // if filtering by RecentlyCommented or LastModified then lets show that data
  const { type } = useAtomValue(fileSortAtom);
  const descriptionOverride =
    type == 'RecentlyCommented' ? (
      <>
        {file.latestComment ? (
          <>
            <Badge color="gray" size="xs">
              {file.totalComments}
            </Badge>
            <Text c="dimmed" fz="xs">
              Latest: {prettyDate(file.latestComment)}
            </Text>
          </>
        ) : null}
      </>
    ) : type == 'LastModified' ? (
      <>
        {modifiedDate ? (
          <Text c="dimmed" fz="xs">
            Modified: {prettyDate(modifiedDate)}
          </Text>
        ) : null}
      </>
    ) : null;
  const onClick = () => {
    if (isFolder) {
      setFolder(file);
    } else {
      setSelectedFileId(file.id);
    }
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
            <Text
              fz="md"
              fw={500}
              title={`Modified: ${modifiedDate ? prettyDate(modifiedDate) : 'N/A'}\nLast Comment: ${file.latestComment ? prettyDate(file.latestComment) : 'N/A'}`}
            >
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
                {descriptionOverride ? (
                  descriptionOverride
                ) : (
                  <>
                    {isMobile ? (
                      <>
                        {file.flag && file.flag != 'None'
                          ? fileFlagStyles[file.flag].icon
                          : null}
                        {file.rating ? (
                          <Text c="dimmed" fz="xs">
                            {pluralize(file.rating, 'Star')}
                            {/*{file.fileSize ? ', ' + prettyBytes(file.fileSize) : null}*/}
                          </Text>
                        ) : null}
                      </>
                    ) : null}
                    {file.totalComments ? (
                      <Text c="dimmed" fz="xs">
                        {pluralize(file.totalComments, 'Comment')}
                        {/*{file.fileSize ? ', ' + prettyBytes(file.fileSize) : null}*/}
                      </Text>
                    ) : null}
                  </>
                )}
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
          {file.users ? (
            <Avatar.Group spacing="xs" style={{ justifyContent: 'flex-end' }}>
              {file.users.map((u) => (
                <PicrAvatar user={u} size="sm" key={u.id} />
              ))}
            </Avatar.Group>
          ) : null}
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
                <DotsIcon />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {isFolder ? (
                <FolderMenu folder={file} />
              ) : (
                <FileMenu file={file} />
              )}
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
};
