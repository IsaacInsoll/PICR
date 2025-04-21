import { tz } from 'moment-timezone';
import moment from 'moment';
import { Text, Tooltip } from '@mantine/core';
import { ReactNode } from 'react';

import { atom, useAtom } from 'jotai';

const dateDisplayRelativeAtom = atom(true);

export const prettyDate = (dateString: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return moment(d).format('MMMM Do YYYY, h:mm:ss a');
};

export const prettyDateNoTZ = (dateString: string): string => {
  // This was tested as matching with Adobe Lightroom perfectly for both `capture time` and `export time`
  const d = new Date(dateString);
  return tz(d, 'YYYY-MM-DDTHH:mm:ss[Z]').format('MMMM Do YYYY, h:mm:ss a');
};

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
      <Text size="sm" onClick={() => setIsRelative(!isRelative)}>
        {isRelative ? ago : full}
      </Text>
    </Tooltip>
  );
};
