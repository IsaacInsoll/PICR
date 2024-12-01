import { useAtom } from 'jotai/index';
import { fileSortAtom } from '../../atoms/fileSortAtom';
import { ActionIcon, Avatar, Box, Button, Group, Select } from '@mantine/core';
import {
  TbArrowsDownUp,
  TbCalendar,
  TbCheck,
  TbChevronDown,
  TbChevronUp,
  TbFileTypography,
  TbSortAscending,
  TbSortDescending,
  TbStar,
} from 'react-icons/tb';
import { ReactNode } from 'react';
import { BiComment } from 'react-icons/bi';
import { useDisclosure } from '@mantine/hooks';
import { useCommentPermissions } from '../../hooks/useCommentPermissions';

export const FileSortSelector = () => {
  const { canView } = useCommentPermissions();
  const [sort, setSort] = useAtom(fileSortAtom);
  const [dropdownOpened, { toggle, close }] = useDisclosure();
  const { type, direction } = sort;
  const sortIcon = sortIcons[direction];
  const { icon } = sortOptions.find((s) => s.value == type);

  const options = sortOptions.filter((s) => !s.requiresComments || canView);

  const renderSelectOption: SelectProps['renderOption'] = ({
    option,
    checked,
  }) => {
    const { icon } = sortOptions.find((s) => s.value == option.value);
    return (
      <Group flex="1" gap="xs">
        <Box>{icon}</Box>
        <Box style={{ flexGrow: 1 }}>{option.label}</Box>
        <Box>
          {checked ? (
            <Avatar color="blue" radius="xs" size="xs" p="0">
              {sortIcon.chevron}
            </Avatar>
          ) : null}
        </Box>
        {/*sortIcon.chevron <TbArrowsDownUp />*/}
      </Group>
    );
  };

  const handleClick = (v) => {
    if (v && v != type) {
      setSort({
        type: v,
        direction: 'Asc',
        // direction: v == 'Filename' ? 'Asc' : 'Desc',
      });
    } else {
      setSort({
        ...sort,
        direction: sort.direction == 'Asc' ? 'Desc' : 'Asc',
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

const sortOptions: [
  { value: FileSortType; label: string; requiresComments: boolean },
] = [
  {
    value: 'Filename',
    label: 'Filename',
    icon: <TbFileTypography />,
    requiresComments: false,
  },
  {
    value: 'LastModified',
    label: 'Modified',
    icon: <TbCalendar />,
    requiresComments: false,
  },
  {
    value: 'RecentlyCommented',
    label: 'Commented',
    icon: <BiComment />,
    requiresComments: true,
  },
  {
    value: 'Rating',
    label: 'Rating',
    icon: <TbStar />,
    requiresComments: true,
  },
];

const sortIcons: {
  [key: keyof FileSortDirection]: { icon: ReactNode; chevron: ReactNode };
} = {
  Asc: { icon: <TbSortDescending />, chevron: <TbChevronDown /> },
  Desc: { icon: <TbSortAscending />, chevron: <TbChevronUp /> },
} as const;
