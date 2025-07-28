import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '@/src/components/Menus/dropdownMenu';
import { ReactNode } from 'react';

export const FileSortMenu = ({ children }: { children: ReactNode }) => {
  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger>{children}</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem key="fernando rojo">
          <DropdownMenuItemTitle>Fernando Rojo</DropdownMenuItemTitle>
        </DropdownMenuItem>

        {/*<DropdownMenuLabel />*/}
        {/*<DropdownMenu.Item>*/}
        {/*  <DropdownMenu.ItemTitle />*/}
        {/*</DropdownMenu.Item>*/}
        {/*<DropdownMenu.Group>*/}
        {/*  <DropdownMenu.Item />*/}
        {/*</DropdownMenu.Group>*/}
        {/*<DropdownMenu.CheckboxItem>*/}
        {/*  <DropdownMenu.ItemIndicator />*/}
        {/*</DropdownMenu.CheckboxItem>*/}
        {/*<DropdownMenu.Sub>*/}
        {/*  <DropdownMenu.SubTrigger />*/}
        {/*  <DropdownMenu.SubContent />*/}
        {/*</DropdownMenu.Sub>*/}
        {/*<DropdownMenu.Separator />*/}
        {/*<DropdownMenu.Arrow />*/}
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};
