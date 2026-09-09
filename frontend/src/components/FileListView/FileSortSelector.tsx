import { useFileSort } from '../../hooks/useFileSort';
import { ActionIcon, Menu } from '@mantine/core';
import type { ReactNode } from 'react';
import { useCommentPermissions } from '../../hooks/useCommentPermissions';
import {
  CalendarIcon,
  CameraIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CommentIcon,
  FilenameIcon,
  FoldersIcon,
  SortAscIcon,
  SortDescIcon,
  StarIcon,
} from '../../PicrIcons';
import type {
  FileSort,
  FileSortDirection,
  FileSortType,
} from '@shared/files/sortFiles';
import {
  defaultSortDirection,
  resolveEffectiveSort,
} from '@shared/files/sortFiles';
import { useTranslation } from 'react-i18next';

export const FileSortMenuButton = ({
  hasMetadata = false,
  hasFiles = true,
  hasFolders = false,
}: {
  hasMetadata?: boolean;
  hasFiles?: boolean;
  hasFolders?: boolean;
}) => {
  const { t } = useTranslation('gallery');
  const [sort] = useFileSort();

  return (
    <Menu shadow="md" width={220} position="bottom-end">
      <Menu.Target>
        <ActionIcon
          variant="default"
          size="lg"
          aria-label={t('sort.button')}
          title={t('sort.button')}
        >
          {sortIcons[sort.direction].icon}
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <FileSortMenuItems
          hasMetadata={hasMetadata}
          hasFiles={hasFiles}
          hasFolders={hasFolders}
        />
      </Menu.Dropdown>
    </Menu>
  );
};

const FileSortMenuItems = ({
  hasMetadata = false,
  hasFiles = true,
  hasFolders = false,
}: {
  hasMetadata?: boolean;
  hasFiles?: boolean;
  hasFolders?: boolean;
}) => {
  const { t } = useTranslation('gallery');
  const { canView } = useCommentPermissions();
  const [sort, setSort] = useFileSort();
  const { direction } = sort;
  const { type } = resolveEffectiveSort(sort, hasMetadata, hasFiles);
  const options = availableSortOptions(canView, hasMetadata, hasFiles);

  const handleSelect = (value: FileSortType) => {
    if (value !== type) {
      setSort(nextSortForType(sort, value));
    } else {
      setSort(toggledDirectionSort(sort, type));
    }
  };

  const showFoldersFirst = hasFiles && hasFolders;
  const foldersFirst = sort.foldersFirst !== false;

  return (
    <>
      <Menu.Label>{t('sort.by')}</Menu.Label>
      {options.map((option) => {
        const isActive = option.value === type;
        return (
          <Menu.Item
            key={option.value}
            leftSection={option.icon}
            rightSection={isActive ? sortIcons[direction].chevron : null}
            fw={isActive ? 600 : undefined}
            onClick={() => handleSelect(option.value)}
          >
            {t(option.labelKey)}
          </Menu.Item>
        );
      })}
      {showFoldersFirst ? (
        <Menu.Item
          leftSection={<FoldersIcon />}
          rightSection={foldersFirst ? <CheckIcon /> : null}
          closeMenuOnClick={false}
          onClick={() => setSort({ ...sort, foldersFirst: !foldersFirst })}
        >
          {t('sort.foldersFirst')}
        </Menu.Item>
      ) : null}
    </>
  );
};

type SortOption = {
  value: FileSortType;
  labelKey:
    | 'sort.filename'
    | 'sort.modified'
    | 'sort.dateTaken'
    | 'sort.commented'
    | 'sort.rating';
  icon: ReactNode;
  requiresComments: boolean;
  requiresMetadata?: boolean;
  // Whether the sort is meaningful for subfolders. Rating/Commented/DateTaken
  // only apply to files, so a folders-only view hides them (sortFolderContents
  // maps folder ordering down to Filename/LastModified anyway).
  folderSortable?: boolean;
};

const sortOptions: SortOption[] = [
  {
    value: 'Filename',
    labelKey: 'sort.filename',
    icon: <FilenameIcon />,
    requiresComments: false,
    folderSortable: true,
  },
  {
    value: 'LastModified',
    labelKey: 'sort.modified',
    icon: <CalendarIcon />,
    requiresComments: false,
    folderSortable: true,
  },
  {
    value: 'DateTaken',
    labelKey: 'sort.dateTaken',
    icon: <CameraIcon />,
    requiresComments: false,
    requiresMetadata: true,
  },
  {
    value: 'RecentlyCommented',
    labelKey: 'sort.commented',
    icon: <CommentIcon />,
    requiresComments: true,
  },
  {
    value: 'Rating',
    labelKey: 'sort.rating',
    icon: <StarIcon />,
    requiresComments: true,
  },
];

// Options for the current context: honours comment/metadata gates, and on a
// folders-only view (no files) keeps only the folder-applicable sorts.
const availableSortOptions = (
  canView: boolean,
  hasMetadata: boolean,
  hasFiles: boolean,
): SortOption[] =>
  sortOptions.filter(
    (s) =>
      (!s.requiresComments || canView) &&
      (!s.requiresMetadata || hasMetadata) &&
      (hasFiles || s.folderSortable),
  );

// Selecting a new sort type applies that type's natural default direction while
// preserving the folders-first choice.
const nextSortForType = (current: FileSort, type: FileSortType): FileSort => ({
  type,
  direction: defaultSortDirection(type),
  foldersFirst: current.foldersFirst,
});

// Re-selecting the active type flips direction, preserving folders-first.
const toggledDirectionSort = (
  current: FileSort,
  type: FileSortType,
): FileSort => ({
  type,
  direction: current.direction === 'Asc' ? 'Desc' : 'Asc',
  foldersFirst: current.foldersFirst,
});

const sortIcons: Record<
  FileSortDirection,
  { icon: ReactNode; chevron: ReactNode }
> = {
  Asc: { icon: <SortAscIcon />, chevron: <ChevronUpIcon /> },
  Desc: { icon: <SortDescIcon />, chevron: <ChevronDownIcon /> },
} as const;
