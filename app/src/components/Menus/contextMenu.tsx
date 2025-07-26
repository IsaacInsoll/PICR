// design-system/context-menu.tsx
import * as ContextMenu from 'zeego/context-menu';
import { View } from 'react-native';

export const ContextMenuRoot = ContextMenu.Root;

export const ContextMenuTrigger = ContextMenu.create(
  (props: React.ComponentProps<typeof ContextMenu.Trigger>) => (
    <ContextMenu.Trigger {...props} asChild>
      <View aria-role="button">{props.children}</View>
    </ContextMenu.Trigger>
  ),
  'Trigger',
);

export const ContextMenuContent = ContextMenu.create(
  (props: React.ComponentProps<typeof ContextMenu.Content>) => (
    <ContextMenu.Content {...props} />
  ),
  'Content',
);

export const ContextMenuItem = ContextMenu.create(
  (props: React.ComponentProps<typeof ContextMenu.Item>) => (
    <ContextMenu.Item {...props} />
  ),
  'Item',
);

export const ContextMenuItemTitle = ContextMenu.create(
  (props: React.ComponentProps<typeof ContextMenu.ItemTitle>) => (
    <ContextMenu.ItemTitle {...props} />
  ),
  'ItemTitle',
);

export const ContextMenuItemIcon = ContextMenu.create(
  (props: React.ComponentProps<typeof ContextMenu.ItemIcon>) => (
    <ContextMenu.ItemIcon {...props} />
  ),
  'ItemIcon',
);

export const ContextMenuItemImage = ContextMenu.create(
  (props: React.ComponentProps<typeof ContextMenu.ItemImage>) => (
    <ContextMenu.ItemImage {...props} />
  ),
  'ItemImage',
);

export const ContextMenuCheckboxItem = ContextMenu.create(
  (props: React.ComponentProps<typeof ContextMenu.CheckboxItem>) => (
    <ContextMenu.CheckboxItem {...props} />
  ),
  'CheckboxItem',
);

export const ContextMenuLabel = ContextMenu.create(
  (props: React.ComponentProps<typeof ContextMenu.Label>) => (
    <ContextMenu.Label {...props} />
  ),
  'Label',
);

export const ContextMenuSeparator = ContextMenu.create(
  (props: React.ComponentProps<typeof ContextMenu.Separator>) => (
    <ContextMenu.Separator {...props} />
  ),
  'Separator',
);

export const ContextMenuGroup = ContextMenu.create(
  (props: React.ComponentProps<typeof ContextMenu.Group>) => (
    <ContextMenu.Group {...props} />
  ),
  'Group',
);

export const ContextMenuSubTrigger = ContextMenu.create(
  (props: React.ComponentProps<typeof ContextMenu.SubTrigger>) => (
    <ContextMenu.SubTrigger {...props} />
  ),
  'SubTrigger',
);

export const ContextMenuSubContent = ContextMenu.create(
  (props: React.ComponentProps<typeof ContextMenu.SubContent>) => (
    <ContextMenu.SubContent {...props} />
  ),
  'SubContent',
);

export const ContextMenuSub = ContextMenu.create(
  (props: React.ComponentProps<typeof ContextMenu.Sub>) => (
    <ContextMenu.Sub {...props} />
  ),
  'Sub',
);

export const ContextMenuItemIndicator = ContextMenu.create(
  (props: React.ComponentProps<typeof ContextMenu.ItemIndicator>) => (
    <ContextMenu.ItemIndicator {...props} />
  ),
  'ItemIndicator',
);

export const ContextMenuPreview = ContextMenu.create(
  (props: React.ComponentProps<typeof ContextMenu.Preview>) => (
    <ContextMenu.Preview {...props} />
  ),
  'Preview',
);

export const ContextMenuArrow = ContextMenu.create(
  (props: React.ComponentProps<typeof ContextMenu.Arrow>) => (
    <ContextMenu.Arrow {...props} />
  ),
  'Arrow',
);
