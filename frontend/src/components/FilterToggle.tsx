import { useAtom, useAtomValue } from 'jotai/index';
import { filterAtom, totalFilterOptionsSelected } from '../atoms/filterAtom';
import { ActionIcon } from '@mantine/core';
import { TbFilter } from 'react-icons/tb';
import { actionIconSize } from '../theme';

export const FilterToggle = ({ disabled }: { disabled?: boolean }) => {
  const [filtering, setFiltering] = useAtom(filterAtom);
  const total = useAtomValue(totalFilterOptionsSelected);
  return (
    <ActionIcon
      variant={filtering && !disabled ? 'filled' : 'default'}
      disabled={disabled}
      onClick={() => setFiltering((f) => !f)}
      // badge={filtering ? total : undefined}
    >
      <TbFilter size={actionIconSize} />
    </ActionIcon>
  );
};
