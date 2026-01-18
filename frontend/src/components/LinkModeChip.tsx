import { LinkMode } from '../../../graphql-types';
import { Badge } from '@mantine/core';
import { linkModeStyle } from './LinkModeStyle';

export const LinkModeChip = ({ linkMode }: { linkMode: LinkMode }) => {
  const { icon, color, label } = linkModeStyle[linkMode];
  return (
    <Badge color={color} size="sm" leftSection={icon}>
      {label}
    </Badge>
  );
};
