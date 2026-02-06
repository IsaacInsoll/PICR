import { useAtom } from 'jotai/index';
import { fileSortAtom } from '../../atoms/fileSortAtom';
import { Avatar, Box, Button, Group, Select, SelectProps } from '@mantine/core';
import { ReactNode } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useCommentPermissions } from '../../hooks/useCommentPermissions';
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CommentIcon,
  FilenameIcon,
  SortAscIcon,
  SortDescIcon,
  StarIcon,
} from '../../PicrIcons';

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
            <Avatar radius="xs" size="xs" p="0">
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

const sortIcons: {
  [key: keyof FileSortDirection]: { icon: ReactNode; chevron: ReactNode };
} = {
  Asc: { icon: <SortDescIcon />, chevron: <ChevronDownIcon /> },
  Desc: { icon: <SortAscIcon />, chevron: <ChevronUpIcon /> },
} as const;
