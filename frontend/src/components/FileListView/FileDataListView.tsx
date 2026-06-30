import type { FileListViewStyleComponentProps } from './FolderContentsView';
import { prettyBytes } from '@shared/prettyBytes';
import {
  createPicrColumns,
  PicrDataGrid,
  type PicrColumns,
} from '../PicrDataGrid';
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

const folderContentsColumn = createPicrColumns<FolderContentsItem>();

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
    ...folderContentsColumn.accessor('name', {
      header: 'Name',
      widthPercent: 10,
    }),
    visibleFor: 'xs',
    isComment: false,
  },
  {
    ...folderContentsColumn.accessor(
      (row) => (isFolderContentsFile(row) ? row.type : 'Folder'),
      {
        id: 'type',
        header: 'Type',
        widthPercent: 10,
      },
    ),
    visibleFor: 'md',
    isComment: false,
  },
  {
    ...folderContentsColumn.accessor(
      (row) => (isFolderContentsFile(row) ? row.rating : null),
      {
        id: 'rating',
        header: 'Rating',
        widthPercent: 10,
        cell: ({ value }) => {
          const rating = Number(value ?? 0);
          return rating > 0 ? <Rating readOnly value={rating} /> : null;
        },
      },
    ),
    isComment: true,
    visibleFor: 'xs',
  },
  {
    ...folderContentsColumn.accessor(
      (row) => (isFolderContentsFile(row) ? row.flag : null),
      {
        id: 'flag',
        header: 'Flag',
        widthPercent: 10,
        cell: ({ value }) => <FileFlagBadge flag={value} />,
      },
    ),
    isComment: true,
    visibleFor: 'xs',
  },
  {
    ...folderContentsColumn.accessor(
      (row) => (isFolderContentsFile(row) ? row.totalComments : null),
      {
        id: 'totalComments',
        header: 'Comments',
        widthPercent: 7,
        cell: ({ value }) => {
          const totalComments = Number(value ?? 0);
          return totalComments > 0 ? totalComments : '';
        },
      },
    ),
    isComment: true,
    visibleFor: 'sm',
  },
  {
    ...folderContentsColumn.accessor(
      (row) => (isFolderContentsFile(row) ? row.latestComment : null),
      {
        id: 'latestComment',
        header: 'Latest Action',
        widthPercent: 10,
        cell: ({ value }) => {
          return <DateDisplay dateString={value ?? undefined} />;
        },
      },
    ),
    isComment: true,
    visibleFor: 'sm',
  },
  {
    ...folderContentsColumn.accessor(
      (row) => (isFolderContentsFile(row) ? row.fileSize : null),
      {
        id: 'fileSize',
        header: 'File Size',
        cell: ({ value }) => {
          return <>{value ? prettyBytes(value) : null}</>;
        },
        widthPercent: 10,
      },
    ),
    visibleFor: 'md',
    isComment: false,
  },
];
