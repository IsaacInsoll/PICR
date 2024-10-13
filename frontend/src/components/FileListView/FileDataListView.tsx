import { MinimalFile } from '../../../types';
import { FileListViewStyleComponentProps } from './FolderContentsView';
import prettyBytes from 'pretty-bytes';
import { PicrColumns, PicrDataGrid } from '../PicrDataGrid';
import { Page } from '../Page';
import { Rating } from '@mantine/core';
import { useCommentPermissions } from '../../hooks/useCommentPermissions';
import { FileFlagBadge } from './Review/FileFlagBadge';
import { FileMenu } from './FileMenu';

export const FileDataListView = ({
  files,
  setSelectedFileId,
  folderId,
}: FileListViewStyleComponentProps) => {
  const { canView } = useCommentPermissions();
  const cols = columns.filter(({ isComment }) => canView || !isComment);

  return (
    <Page>
      <PicrDataGrid
        columns={cols}
        data={files}
        onClick={(row) => setSelectedFileId(row.id)}
        menuItems={({ row }) => <FileMenu file={row.original} />}
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
