import { useAtom, useAtomValue } from 'jotai/index';
import { filterAtom, totalFilterOptionsSelected } from '../atoms/filterAtom';
import { Badge, Button } from '@mantine/core';
import { TbFilter } from 'react-icons/tb';
import { useIsMobile } from '../hooks/useIsMobile';

export const FilterToggle = ({ disabled }: { disabled?: boolean }) => {
  const [filtering, setFiltering] = useAtom(filterAtom);
  const total = useAtomValue(totalFilterOptionsSelected);
  const isMobile = useIsMobile(); // hide count on mobile as it causes overflow on small viewport sizes

  return (
    <Button
      variant={filtering && !disabled ? 'light' : 'default'}
      disabled={disabled}
      onClick={() => setFiltering((f) => !f)}
      leftSection={<TbFilter />}
    >
      Filter{' '}
      {filtering && !isMobile && total > 0 ? (
        <Badge size="sm" ml="xs">
          {total}
        </Badge>
      ) : null}
    </Button>
  );
};
