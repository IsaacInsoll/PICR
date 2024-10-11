import { MinimalFile } from '../../../types';
import { FileListViewStyleComponentProps } from './FolderContentsView';
import prettyBytes from 'pretty-bytes';
import { PicrColumns, PicrDataGrid } from '../PicrDataGrid';
import { Page } from '../Page';
import { Group, Menu, Rating, Text } from '@mantine/core';
import { TbCloudDownload, TbFile, TbInfoCircle } from 'react-icons/tb';
import { useSetFolder } from '../../hooks/useSetFolder';
import { imageURL } from '../../helpers/imageURL';
import { useCommentPermissions } from '../../hooks/useCommentPermissions';
import { FileFlagBadge } from './Review/FileFlagBadge';
import { BiComment, BiCommentDetail } from 'react-icons/bi';
import {
  useOpenCommentsModal,
  useOpenFileInfoModal,
} from '../../atoms/modalAtom';

export const FileDataListView = ({
  files,
  setSelectedFileId,
  folderId,
}: FileListViewStyleComponentProps) => {
  const setFolder = useSetFolder();
  const { canView } = useCommentPermissions();
  const cols = columns.filter(({ isComment }) => canView || !isComment);

  const openComment = useOpenCommentsModal();
  const openFileInfo = useOpenFileInfoModal();

  const fileMenuItems = ({ row }) => {
    const f: MinimalFile = row.original;
    return (
      <>
        <Menu.Item
          leftSection={<TbFile size="20" />}
          key={1}
          onClick={() => {
            setFolder({ id: folderId }, f);
          }}
        >
          View {f.name}
        </Menu.Item>
        <Menu.Item
          leftSection={<TbInfoCircle size="20" />}
          key={2}
          onClick={() => openFileInfo(f)}
        >
          Details
        </Menu.Item>
        {canView ? (
          <Menu.Item
            leftSection={
              f.totalComments == 0 ? <BiComment /> : <BiCommentDetail />
            }
            key={2}
            onClick={() => openComment(f)}
          >
            <Group gap={8}>
              Comments
              <Text c="dimmed" size="xs">
                ({f.totalComments})
              </Text>
            </Group>
          </Menu.Item>
        ) : null}
        <Menu.Item
          component="a"
          leftSection={<TbCloudDownload />}
          key={3}
          href={imageURL(f, 'raw')}
          download={true}
        >
          Download
        </Menu.Item>
      </>
    );
  };

  return (
    <Page>
      <PicrDataGrid
        columns={cols}
        data={files}
        onClick={(row) => setSelectedFileId(row.id)}
        menuItems={fileMenuItems}
      />
    </Page>
  );
};

const columns: (PicrColumns<MinimalFile> & { isComment: boolean })[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'type', header: 'Type', size: 10 },
  {
    accessorKey: 'rating',
    header: 'Rating',
    isComment: true,
    Cell: ({ cell }) => {
      const rating = cell.getValue();
      return rating > 0 ? <Rating readOnly value={rating} /> : null;
    },
  },
  {
    accessorKey: 'flag',
    header: 'Flag',
    size: 10,
    isComment: true,
    Cell: ({ cell }) => <FileFlagBadge flag={cell.getValue()} />,
  },
  {
    accessorKey: 'totalComments',
    header: 'Comments',
    size: 10,
    Cell: ({ cell }) => {
      const totalComments = cell.getValue();
      return totalComments > 0 ? totalComments : '';
    },
    isComment: true,
  },
  {
    accessorKey: 'fileSize',
    header: 'File Size',
    Cell: ({ cell }) => {
      const fileSize = cell.getValue();
      return <>{fileSize ? prettyBytes(fileSize) : null}</>;
    },
    size: 10,
  },
];
