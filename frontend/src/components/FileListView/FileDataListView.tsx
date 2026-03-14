import type { FileListViewStyleComponentProps } from './FolderContentsView';
import { prettyBytes } from '@shared/prettyBytes';
import type { PicrColumns } from '../PicrDataGrid';
import { PicrDataGrid } from '../PicrDataGrid';
import { Page } from '../Page';
import type { MantineSize } from '@mantine/core';
import { Rating } from '@mantine/core';
import { useCommentPermissions } from '../../hooks/useCommentPermissions';
import { FileFlagBadge } from './Review/FileFlagBadge';
import { FileMenu } from './FileMenu';
import { DateDisplay } from './Filtering/PrettyDate';
import { useIsMobile, useIsSmallScreen } from '../../hooks/useIsMobile';
import { FolderMenuItems } from './FolderMenu';
import { useSetFolder } from '../../hooks/useSetFolder';
import type { FolderContentsItem } from '@shared/files/folderContentsViewModel';
import { isFolderContentsFile } from '@shared/files/folderContentsViewModel';

export const FileDataListView = ({
  files,
  setSelectedFileId,
  folders,
  items,
}: FileListViewStyleComponentProps) => {
  const { canView, isNone } = useCommentPermissions();
  const setFolder = useSetFolder();

  const isMobile = useIsMobile();
  const isSmall = useIsSmallScreen();

  const cols = columns
    .filter(({ isComment }) => canView || !isComment)
    .filter(
      ({ visibleFor }) =>
        visibleFor === 'xs' ||
        (visibleFor === 'sm' && (!isMobile || isNone)) ||
        (visibleFor === 'md' && (isNone || (!isMobile && !isSmall))),
    );

  return (
    <Page>
      <PicrDataGrid
        columns={cols}
        data={(items ?? [...folders, ...files]) as FolderContentsItem[]}
        onClick={(row) =>
          !isFolderContentsFile(row)
            ? setFolder(row)
            : setSelectedFileId(row.id)
        }
        menuItems={({ row }) =>
          !isFolderContentsFile(row.original) ? (
            <FolderMenuItems folder={row.original} />
          ) : (
            <FileMenu file={row.original} />
          )
        }
      />
    </Page>
  );
};

const columns: (PicrColumns<FolderContentsItem> & {
  isComment: boolean;
  visibleFor: MantineSize;
})[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    size: 10,
    visibleFor: 'xs',
    isComment: false,
  },
  {
    header: 'Type',
    size: 10,
    visibleFor: 'md',
    isComment: false,
    accessorFn: (row) => {
      return isFolderContentsFile(row) ? row.type : 'Folder';
    },
  },
  {
    accessorKey: 'rating',
    header: 'Rating',
    isComment: true,
    size: 10,
    Cell: ({ cell }) => {
      const rating = Number(cell.getValue() ?? 0);
      return rating > 0 ? <Rating readOnly value={rating} /> : null;
    },
    visibleFor: 'xs',
  },
  {
    accessorKey: 'flag',
    header: 'Flag',
    size: 10,
    isComment: true,
    Cell: ({ cell }) => <FileFlagBadge flag={cell.getValue() as never} />,
    visibleFor: 'xs',
  },
  {
    accessorKey: 'totalComments',
    header: 'Comments',
    size: 7,
    Cell: ({ cell }) => {
      const totalComments = Number(cell.getValue() ?? 0);
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
      const value = cell.getValue();
      return <DateDisplay dateString={value ? String(value) : undefined} />;
    },
    isComment: true,
    visibleFor: 'sm',
  },
  {
    accessorKey: 'fileSize',
    header: 'File Size',
    Cell: ({ cell }) => {
      const fileSize = Number(cell.getValue() ?? 0);
      return <>{fileSize ? prettyBytes(fileSize) : null}</>;
    },
    size: 10,
    visibleFor: 'md',
    isComment: false,
  },
];
