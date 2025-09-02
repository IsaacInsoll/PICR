import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemTitle,
  DropdownMenuLabel,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '@/src/components/Menus/dropdownMenu';
import { ReactNode } from 'react';
import { useAtom } from 'jotai/index';
import { fileSortAtom } from '@/src/atoms/atoms';
import { FileSortDirection, FileSortType } from '@shared/files/sortFiles';
import { SFSymbol } from 'expo-symbols';

export const FileSortMenu = ({ children }: { children: ReactNode }) => {
  const [sort, setSort] = useAtom(fileSortAtom);
  // console.log('sort', sort);

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger>{children}</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Sort files</DropdownMenuLabel>
        {sortOptions.map(({ label, value, sfSymbol }) => (
          <DropdownMenuCheckboxItem
            key={value}
            onSelect={() => setSort((s) => ({ ...s, type: value }))}
            value={sort.type == value ? 'on' : 'off'}
          >
            <DropdownMenuItemTitle>{label}</DropdownMenuItemTitle>
            <DropdownMenuItemIcon ios={{ name: sfSymbol }} />
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuGroup>
          <DropdownMenuLabel>Direction</DropdownMenuLabel>
          {sortDirectionOptions.map(({ label, value, sfSymbol }) => (
            <DropdownMenuCheckboxItem
              key={value}
              onSelect={() => setSort((s) => ({ ...s, direction: value }))}
              value={sort.direction == value ? 'on' : 'off'}
            >
              <DropdownMenuItemTitle>{label}</DropdownMenuItemTitle>
              <DropdownMenuItemIcon ios={{ name: sfSymbol }} />
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};

const sortOptions: {
  label: string;
  value: FileSortType;
  sfSymbol: SFSymbol;
}[] = [
  {
    label: 'Filename',
    value: 'Filename',
    sfSymbol: 'textformat.abc',
  },
  { label: 'Last Modified', value: 'LastModified', sfSymbol: 'clock' },
  {
    label: 'Recently Commented',
    value: 'RecentlyCommented',
    sfSymbol: 'text.bubble',
  },
  { label: 'Rating', value: 'Rating', sfSymbol: 'star' },
];

const sortDirectionOptions: {
  label: string;
  value: FileSortDirection;
  sfSymbol: SFSymbol;
}[] = [
  { label: 'Asc', value: 'Asc', sfSymbol: 'chevron.up' },
  { label: 'Desc', value: 'Desc', sfSymbol: 'chevron.down' },
];
