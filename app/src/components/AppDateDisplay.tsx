import { useAtom } from 'jotai';
import type { ReactNode } from 'react';
import { finePrint } from '@/src/constants';
import { PText } from '@/src/components/PText';
import { dateDisplayRelativeAtom } from '@shared/uiAtoms';
import {
  formatDate,
  formatRelativeTime,
  tooltipDateTimeFormatOptions,
} from '@shared/i18n/formatting';

export const AppDateDisplay = ({
  dateString,
}: {
  dateString?: string;
}): ReactNode => {
  const [isRelative] = useAtom(dateDisplayRelativeAtom);
  if (!dateString) return null;
  const ago = formatRelativeTime(dateString);
  const full = formatDate(dateString, 'en', tooltipDateTimeFormatOptions);

  // in web frontend (mantine) this had props: size="sm" c="dimmed"

  return (
    // <TouchableOpacity onPress={() => setIsRelative(!isRelative)}>
    <PText style={finePrint}>{isRelative ? ago : full}</PText>
    // </TouchableOpacity>
  );
};
