import type { LinkMode } from '@shared/gql/graphql';
import { Badge } from '@mantine/core';
import { linkModeStyle } from './LinkModeStyle';
import { useTranslation } from 'react-i18next';

export const LinkModeChip = ({ linkMode }: { linkMode: LinkMode }) => {
  const { t } = useTranslation('admin');
  const { icon, color } = linkModeStyle[linkMode];
  const label =
    linkMode === 'final_delivery'
      ? t('links.mode.finalDelivery')
      : t('links.mode.proofsOnly');
  return (
    <Badge color={color} size="sm" leftSection={icon}>
      {label}
    </Badge>
  );
};
