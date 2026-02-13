import * as DropdownMenu from 'zeego/dropdown-menu';
import { View } from 'react-native';

// A menu component anchored to a button pressed by a user.
export const DropdownMenuRoot = DropdownMenu.Root;
export const DropdownMenuTrigger = DropdownMenu.create(
  (props: React.ComponentProps<typeof DropdownMenu.Trigger>) => (
    <DropdownMenu.Trigger {...props} asChild>
      <View aria-role="button">{props.children}</View>
    </DropdownMenu.Trigger>
  ),
  'Trigger',
);
export const DropdownMenuContent = DropdownMenu.Content;

export const DropdownMenuItem = DropdownMenu.create(
  (props: React.ComponentProps<typeof DropdownMenu.Item>) => (
    <DropdownMenu.Item {...props} style={{ height: 34 }} />
  ),
  'Item',
);

export const DropdownMenuItemTitle = DropdownMenu.create(
  (props: React.ComponentProps<typeof DropdownMenu.ItemTitle>) => (
    <DropdownMenu.ItemTitle {...props} />
  ),
  'ItemTitle',
);

export const DropdownMenuItemIcon = DropdownMenu.create(
  (props: React.ComponentProps<typeof DropdownMenu.ItemIcon>) => (
    <DropdownMenu.ItemIcon {...props} />
  ),
  'ItemIcon',
);

export const DropdownMenuItemImage = DropdownMenu.create(
  (props: React.ComponentProps<typeof DropdownMenu.ItemImage>) => (
    <DropdownMenu.ItemImage {...props} />
  ),
  'ItemImage',
);

export const DropdownMenuLabel = DropdownMenu.create(
  (props: React.ComponentProps<typeof DropdownMenu.Label>) => (
    <DropdownMenu.Label {...props} />
  ),
  'Label',
);

export const DropdownMenuSeparator = DropdownMenu.create(
  (props: React.ComponentProps<typeof DropdownMenu.Separator>) => (
    <DropdownMenu.Separator {...props} />
  ),
  'Separator',
);

export const DropdownMenuGroup = DropdownMenu.create(
  (props: React.ComponentProps<typeof DropdownMenu.Group>) => (
    <DropdownMenu.Group {...props} />
  ),
  'Group',
);

export const DropdownMenuCheckboxItem = DropdownMenu.create(
  (props: React.ComponentProps<typeof DropdownMenu.CheckboxItem>) => (
    <DropdownMenu.CheckboxItem
      {...props}
      style={{ ...props.style, display: 'flex', alignItems: 'center', gap: 8 }}
    >
      <DropdownMenu.ItemIndicator />
    </DropdownMenu.CheckboxItem>
  ),
  'CheckboxItem',
);

export const DropdownMenuSubTrigger = DropdownMenu.create(
  (props: React.ComponentProps<typeof DropdownMenu.SubTrigger>) => (
    <DropdownMenu.SubTrigger {...props} />
  ),
  'SubTrigger',
);

export const DropdownMenuSubContent = DropdownMenu.create(
  (props: React.ComponentProps<typeof DropdownMenu.SubContent>) => (
    <DropdownMenu.SubContent {...props} />
  ),
  'SubContent',
);

export const DropdownMenuSub = DropdownMenu.create(
  (props: React.ComponentProps<typeof DropdownMenu.Sub>) => (
    <DropdownMenu.Sub {...props} />
  ),
  'Sub',
);

export const DropdownMenuItemIndicator = DropdownMenu.create(
  (props: React.ComponentProps<typeof DropdownMenu.ItemIndicator>) => (
    <DropdownMenu.ItemIndicator {...props} />
  ),
  'ItemIndicator',
);

export const DropdownMenuArrow = DropdownMenu.create(
  (props: React.ComponentProps<typeof DropdownMenu.Arrow>) => (
    <DropdownMenu.Arrow {...props} />
  ),
  'Arrow',
);
