import { useAtom, useAtomValue } from 'jotai/index';
import { filterAtom, totalFilterOptionsSelected } from '../atoms/filterAtom';
import { Badge, Button } from '@mantine/core';
import { TbFilter } from 'react-icons/tb';

export const FilterToggle = ({ disabled }: { disabled?: boolean }) => {
  const [filtering, setFiltering] = useAtom(filterAtom);
  const total = useAtomValue(totalFilterOptionsSelected);
  return (<Button
      variant={filtering && !disabled ? 'light' : 'default'}
      disabled={disabled}
      onClick={() => setFiltering((f) => !f)}
      leftSection={<TbFilter />}
    >
      Filter {filtering && total > 0 ? <Badge size="sm" ml="xs">{total}</Badge> : null}
    </Button>
  );
};
