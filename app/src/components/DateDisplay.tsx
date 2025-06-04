import { useAtom } from 'jotai';
import { atom } from 'jotai';
import { ReactNode } from 'react';
import moment from 'moment';
import { TouchableOpacity } from 'react-native';
import { finePrint } from '@/src/constants';
import { PText } from '@/src/components/PText';

const dateDisplayRelativeAtom = atom(true);

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

  // in web frontend (mantine) this had props: size="sm" c="dimmed"

  return (
    <TouchableOpacity onPress={() => setIsRelative(!isRelative)}>
      <PText style={finePrint}>{isRelative ? ago : full}</PText>
    </TouchableOpacity>
  );
};
