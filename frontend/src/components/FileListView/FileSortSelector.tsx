import { useAtom } from 'jotai';
import { fileSortAtom } from '../../atoms/fileSortAtom';
import type { SelectProps } from '@mantine/core';
import {
  Avatar,
  Box,
  Button,
  Group,
  Menu,
  Select,
  Tooltip,
} from '@mantine/core';
import type { ReactNode } from 'react';
import { useDisclosure } from '@mantine/hooks';
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

export const FileSortSelector = ({
  hasMetadata = false,
  hasFiles = true,
  hasFolders = false,
}: {
  hasMetadata?: boolean;
  hasFiles?: boolean;
  hasFolders?: boolean;
}) => {
  const { canView } = useCommentPermissions();
  const [sort, setSort] = useAtom(fileSortAtom);
  const [dropdownOpened, { toggle, close }] = useDisclosure();
  const { direction } = sort;
  // Same effective sort the gallery uses (FolderContentsView), so the displayed
  // option always matches the actual order.
  const { type } = resolveEffectiveSort(sort, hasMetadata, hasFiles);
  const sortIcon = sortIcons[direction];
  const selectedSortOption =
    sortOptions.find((s) => s.value === type) ?? sortOptions[0];
  const { icon } = selectedSortOption;

  const options = availableSortOptions(canView, hasMetadata, hasFiles);

  const renderSelectOption: SelectProps['renderOption'] = ({
    option,
    checked,
  }) => {
    const optionIcon = sortOptions.find((s) => s.value === option.value)?.icon;
    return (
      <Group flex="1" gap="xs">
        <Box>{optionIcon}</Box>
        <Box style={{ flexGrow: 1 }}>{option.label}</Box>
        <Box>
          {checked ? (
            <Avatar radius="xs" size="xs" p="0">
              {sortIcon.chevron}
            </Avatar>
          ) : null}
        </Box>
        {/*sortIcon.chevron <TbArrowsDownUp />*/}
      </Group>
    );
  };

  const handleClick = (v: string | null) => {
    const selectedOption = sortOptions.find((s) => s.value === v);
    if (selectedOption && selectedOption.value !== type) {
      setSort(nextSortForType(sort, selectedOption.value));
    } else {
      setSort(toggledDirectionSort(sort, type));
    }
    close();
  };

  // Folders-first only means something when files and folders coexist.
  const showFoldersFirst = hasFiles && hasFolders;
  const foldersFirst = sort.foldersFirst !== false;

  return (
    <Group gap="xs" wrap="nowrap">
      {!dropdownOpened ? (
        <Button onClick={toggle} variant="default">
          <Group gap={2}>
            {icon}
            {sortIcon.chevron}
            <Box pl={2}>Sort</Box>
          </Group>
        </Button>
      ) : (
        <Select
          style={{ width: 150 }}
          comboboxProps={{ width: 200, position: 'bottom-start' }}
          dropdownOpened={dropdownOpened}
          checkIconPosition="right"
          data={options}
          value={type}
          onChange={handleClick}
          renderOption={renderSelectOption}
          onDropdownClose={close}
          leftSectionWidth={64}
          leftSection={
            <Group gap={2} style={{ minWidth: 32 }}>
              {icon}
              {sortIcon.chevron}
            </Group>
          }
        />
      )}
      {showFoldersFirst ? (
        <Tooltip
          label={foldersFirst ? 'Folders first' : 'Folders mixed with files'}
        >
          <Button
            variant={foldersFirst ? 'light' : 'default'}
            px="xs"
            aria-label="Folders first"
            aria-pressed={foldersFirst}
            onClick={() => setSort({ ...sort, foldersFirst: !foldersFirst })}
          >
            <FoldersIcon />
          </Button>
        </Tooltip>
      ) : null}
    </Group>
  );
};

export const FileSortMenuItems = ({
  hasMetadata = false,
  hasFiles = true,
  hasFolders = false,
}: {
  hasMetadata?: boolean;
  hasFiles?: boolean;
  hasFolders?: boolean;
}) => {
  const { canView } = useCommentPermissions();
  const [sort, setSort] = useAtom(fileSortAtom);
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
      <Menu.Divider />
      <Menu.Label>Sort by</Menu.Label>
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
            {option.label}
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
          Folders first
        </Menu.Item>
      ) : null}
    </>
  );
};

type SortOption = {
  value: FileSortType;
  label: string;
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
    label: 'Filename',
    icon: <FilenameIcon />,
    requiresComments: false,
    folderSortable: true,
  },
  {
    value: 'LastModified',
    label: 'Modified',
    icon: <CalendarIcon />,
    requiresComments: false,
    folderSortable: true,
  },
  {
    value: 'DateTaken',
    label: 'Date taken',
    icon: <CameraIcon />,
    requiresComments: false,
    requiresMetadata: true,
  },
  {
    value: 'RecentlyCommented',
    label: 'Commented',
    icon: <CommentIcon />,
    requiresComments: true,
  },
  {
    value: 'Rating',
    label: 'Rating',
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
