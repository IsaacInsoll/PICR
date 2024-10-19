import { MinimalFile } from '../../../types';
import { FileListViewStyleComponentProps } from './FolderContentsView';
import prettyBytes from 'pretty-bytes';
import { PicrColumns, PicrDataGrid } from '../PicrDataGrid';
import { Page } from '../Page';
import { MantineSize, Rating } from '@mantine/core';
import { useCommentPermissions } from '../../hooks/useCommentPermissions';
import { FileFlagBadge } from './Review/FileFlagBadge';
import { FileMenu } from './FileMenu';
import { fromNow } from './Filtering/PrettyDate';
import { useIsMobile, useIsSmallScreen } from '../../hooks/useIsMobile';

export const FileDataListView = ({
  files,
  setSelectedFileId,
  folderId,
}: FileListViewStyleComponentProps) => {
  const { canView, isNone } = useCommentPermissions();

  const isMobile = useIsMobile();
  const isSmall = useIsSmallScreen();

  const cols = columns
    .filter(({ isComment }) => canView || !isComment)
    .filter(
      ({ visibleFor }) =>
        visibleFor == 'xs' ||
        (visibleFor == 'sm' && (!isMobile || isNone)) ||
        (visibleFor == 'md' && (isNone || (!isMobile && !isSmall))),
    );

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

const columns: (PicrColumns<MinimalFile> & {
  isComment: boolean;
  visibleFor: MantineSize;
})[] = [
  { accessorKey: 'name', header: 'Name', size: 10, visibleFor: 'xs' },
  { accessorKey: 'type', header: 'Type', size: 10, visibleFor: 'md' },
  {
    accessorKey: 'rating',
    header: 'Rating',
    isComment: true,
    size: 10,
    Cell: ({ cell }) => {
      const rating = cell.getValue();
      return rating > 0 ? <Rating readOnly value={rating} /> : null;
    },
    visibleFor: 'xs',
  },
  {
    accessorKey: 'flag',
    header: 'Flag',
    size: 10,
    isComment: true,
    Cell: ({ cell }) => <FileFlagBadge flag={cell.getValue()} />,
    visibleFor: 'xs',
  },
  {
    accessorKey: 'totalComments',
    header: 'Comments',
    size: 7,
    Cell: ({ cell }) => {
      const totalComments = cell.getValue();
      return totalComments > 0 ? totalComments : '';
    },
    isComment: true,
    visibleFor: 'sm',
  },
  {
    accessorKey: 'latestComment',
    header: 'Latest Action',
    size: 10,
    Cell: ({ cell }) => {
      const latest = cell.getValue();
      return latest ? fromNow(latest) : '';
    },
    isComment: true,
    visibleFor: 'sm',
  },
  {
    accessorKey: 'fileSize',
    header: 'File Size',
    Cell: ({ cell }) => {
      const fileSize = cell.getValue();
      return <>{fileSize ? prettyBytes(fileSize) : null}</>;
    },
    size: 10,
    visibleFor: 'md',
  },
];
