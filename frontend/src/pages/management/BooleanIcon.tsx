import { CircleCheckIcon, CircleXIcon } from '../../PicrIcons';

export const BooleanIcon = ({ value }: { value: boolean }) => {
  return value ? (
    <CircleCheckIcon style={{ color: 'green' }} />
  ) : (
    <CircleXIcon style={{ color: 'red' }} />
  );
};
