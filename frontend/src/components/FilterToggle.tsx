import { useAtom, useAtomValue } from 'jotai/index';
import { filterAtom, totalFilterOptionsSelected } from '../atoms/filterAtom';
import { ActionIcon, Button } from '@mantine/core';
import { TbFilter } from 'react-icons/tb';
import { actionIconSize } from '../theme';

export const FilterToggle = ({ disabled }: { disabled?: boolean }) => {
  const [filtering, setFiltering] = useAtom(filterAtom);
  const total = useAtomValue(totalFilterOptionsSelected);
  return (
    <Button
      variant={filtering && !disabled ? 'light' : 'default'}
      disabled={disabled}
      onClick={() => setFiltering((f) => !f)}
      // badge={filtering ? total : undefined}
      leftSection={<TbFilter />}
    >
      Filter
    </Button>
  );
};
