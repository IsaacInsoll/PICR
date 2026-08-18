import { Text, Tooltip } from '@mantine/core';
import type { ReactNode } from 'react';
import { tooltipDateTimeFormatOptions } from '@shared/i18n/formatting';
import { useDateFormatters } from '../../../i18n/useDateFormatters';

export const DateDisplay = ({
  dateString,
}: {
  dateString?: string;
}): ReactNode => {
  const { formatDate, formatRelativeTime } = useDateFormatters();
  if (!dateString) return null;
  const ago = formatRelativeTime(dateString);
  const full = formatDate(dateString, tooltipDateTimeFormatOptions);

  return (
    <Tooltip label={full}>
      <Text size="sm" c="dimmed">
        {ago}
      </Text>
    </Tooltip>
  );
};
