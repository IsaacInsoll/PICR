import moment from 'moment';
import { Text, Tooltip } from '@mantine/core';
import type { ReactNode } from 'react';

export const DateDisplay = ({
  dateString,
}: {
  dateString?: string;
}): ReactNode => {
  if (!dateString) return null;
  const d = moment(new Date(dateString));
  const ago = d.fromNow();
  const full = d.format('llll');

  return (
    <Tooltip label={full}>
      <Text size="sm" c="dimmed">
        {ago}
      </Text>
    </Tooltip>
  );
};
