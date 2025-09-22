import moment from 'moment';
import { Text, Tooltip } from '@mantine/core';
import { ReactNode } from 'react';

import { useAtom } from 'jotai';
import { dateDisplayRelativeAtom } from '@shared/uiAtoms';

export const DateDisplay = ({
  dateString,
}: {
  dateString?: string;
}): ReactNode => {
  const [isRelative, setIsRelative] = useAtom(dateDisplayRelativeAtom);
  if (!dateString) return null;
  const d = moment(new Date(dateString));
  const ago = d.fromNow();
  const full = d.format('llll');

  return (
    <Tooltip label={isRelative ? full : ago}>
      <Text size="sm" c="dimmed" onClick={() => setIsRelative(!isRelative)}>
        {isRelative ? ago : full}
      </Text>
    </Tooltip>
  );
};
