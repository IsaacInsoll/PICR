import { useAtom } from 'jotai';
import { fileSortAtom } from '../../atoms/fileSortAtom';
import type { SelectProps } from '@mantine/core';
import { Avatar, Box, Button, Group, Menu, Select } from '@mantine/core';
import type { ReactNode } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useCommentPermissions } from '../../hooks/useCommentPermissions';
import {
  CalendarIcon,
  CameraIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CommentIcon,
  FilenameIcon,
  SortAscIcon,
  SortDescIcon,
  StarIcon,
} from '../../PicrIcons';
import type { FileSortDirection, FileSortType } from '@shared/files/sortFiles';
import {
  defaultSortDirection,
  resolveEffectiveSort,
} from '@shared/files/sortFiles';

export const FileSortSelector = ({
  hasMetadata = false,
}: {
  hasMetadata?: boolean;
}) => {
  const { canView } = useCommentPermissions();
  const [sort, setSort] = useAtom(fileSortAtom);
  const [dropdownOpened, { toggle, close }] = useDisclosure();
  const { direction } = sort;
  // Same effective sort the gallery uses (FolderContentsView), so the displayed
  // option always matches the actual order.
  const { type } = resolveEffectiveSort(sort, hasMetadata);
  const sortIcon = sortIcons[direction];
  const selectedSortOption =
    sortOptions.find((s) => s.value === type) ?? sortOptions[0];
  const { icon } = selectedSortOption;

  const options = sortOptions.filter(
    (s) =>
      (!s.requiresComments || canView) && (!s.requiresMetadata || hasMetadata),
  );

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
      setSort({
        type: selectedOption.value,
        direction: defaultSortDirection(selectedOption.value),
      });
    } else {
      setSort({
        type,
        direction: sort.direction === 'Asc' ? 'Desc' : 'Asc',
      });
    }
    close();
  };

  return (
    <>
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
    </>
  );
};

export const FileSortMenuItems = ({
  hasMetadata = false,
}: {
  hasMetadata?: boolean;
}) => {
  const { canView } = useCommentPermissions();
  const [sort, setSort] = useAtom(fileSortAtom);
  const { direction } = sort;
  const { type } = resolveEffectiveSort(sort, hasMetadata);
  const options = sortOptions.filter(
    (s) =>
      (!s.requiresComments || canView) && (!s.requiresMetadata || hasMetadata),
  );

  const handleSelect = (value: FileSortType) => {
    if (value !== type) {
      setSort({ type: value, direction: defaultSortDirection(value) });
    } else {
      setSort({
        type,
        direction: sort.direction === 'Asc' ? 'Desc' : 'Asc',
      });
    }
  };

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
    </>
  );
};

type SortOption = {
  value: FileSortType;
  label: string;
  icon: ReactNode;
  requiresComments: boolean;
  requiresMetadata?: boolean;
};

const sortOptions: SortOption[] = [
  {
    value: 'Filename',
    label: 'Filename',
    icon: <FilenameIcon />,
    requiresComments: false,
  },
  {
    value: 'LastModified',
    label: 'Modified',
    icon: <CalendarIcon />,
    requiresComments: false,
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

const sortIcons: Record<
  FileSortDirection,
  { icon: ReactNode; chevron: ReactNode }
> = {
  Asc: { icon: <SortAscIcon />, chevron: <ChevronUpIcon /> },
  Desc: { icon: <SortDescIcon />, chevron: <ChevronDownIcon /> },
} as const;
