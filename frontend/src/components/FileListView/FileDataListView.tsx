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
import { useFolderUrl, useSetFolder } from '../../hooks/useSetFolder';
import type { FolderContentsItem } from '@shared/files/folderContentsViewModel';
import { isFolderContentsFile } from '@shared/files/folderContentsViewModel';
import { normalizeDisplayName } from '@shared/displayName';
import { PicrLink } from '../PicrLink';
import { FileLink } from '../FileLink';
import { useLanguage } from '../../i18n/useLanguage';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { fileTypeLabel, type GalleryT } from '../../i18n/galleryLabels';

const folderContentsColumn = createPicrColumns<FolderContentsItem>();

// Names render as real links so they can be opened in a new tab: folders link to
// the folder, image files to the lightbox URL. Videos and other files stay plain
// text (their row click still opens the lightbox). The row onClick bails on a
// link's plain click via event.defaultPrevented, so the two don't both fire.
const NameCell = ({ item }: { item: FolderContentsItem }) => {
  const folderUrl = useFolderUrl();
  const name = normalizeDisplayName(item.name);
  if (!isFolderContentsFile(item)) {
    return (
      <PicrLink to={folderUrl(item)} underline="never" c="inherit">
        {name}
      </PicrLink>
    );
  }
  if (item.type === 'Image') {
    return (
      <FileLink folderId={item.folderId} fileId={item.id} c="inherit">
        {name}
      </FileLink>
    );
  }
  return <>{name}</>;
};

const FileSizeCell = ({ value }: { value: string | null }) => {
  const { formattingLocale } = useLanguage();
  return value ? prettyBytes(value, { locale: formattingLocale }) : null;
};

export const FileDataListView = ({
  files,
  setSelectedFileId,
  folders,
  items,
}: FileListViewStyleComponentProps) => {
  const { t } = useTranslation('gallery');
  const { canView, isNone } = useCommentPermissions();
  const setFolder = useSetFolder();

  const isMobile = useIsMobile();
  const isSmall = useIsSmallScreen();

  const columns = useMemo(() => buildColumns(t), [t]);
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
        onClick={(row, event) => {
          // The name cell is a real link (folder, or image file). Skip if it
          // already handled the click (plain click -> preventDefault) or it's a
          // modified/middle click (let the browser open a new tab).
          if (
            event.defaultPrevented ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            event.button !== 0
          ) {
            return;
          }
          if (isFolderContentsFile(row)) {
            setSelectedFileId(row.id);
          } else {
            setFolder(row);
          }
        }}
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

const buildColumns = (
  t: GalleryT,
): (PicrColumns<FolderContentsItem> & {
  isComment: boolean;
  visibleFor: MantineSize;
})[] => [
  {
    ...folderContentsColumn.accessor('name', {
      header: t('file.name'),
      widthPercent: 10,
      cell: ({ row }) => <NameCell item={row.original} />,
    }),
    visibleFor: 'xs',
    isComment: false,
  },
  {
    ...folderContentsColumn.accessor(
      (row) => (isFolderContentsFile(row) ? row.type : 'Folder'),
      {
        id: 'type',
        header: t('file.type'),
        widthPercent: 10,
        cell: ({ value }) => fileTypeLabel(String(value), t),
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
        header: t('review.rating'),
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
        header: t('review.flag'),
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
        header: t('comments.comments'),
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
        header: t('file.latest'),
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
        header: t('file.size'),
        cell: ({ value }) => {
          return <FileSizeCell value={value} />;
        },
        widthPercent: 10,
      },
    ),
    visibleFor: 'md',
    isComment: false,
  },
];
