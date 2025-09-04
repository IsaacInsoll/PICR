import { TbCircleCheck, TbCircleXFilled } from 'react-icons/tb';

export const BooleanIcon = ({ value }: { value: boolean }) => {
  return value ? (
    <TbCircleCheck style={{ color: 'green' }} />
  ) : (
    <TbCircleXFilled style={{ color: 'red' }} />
  );
};
