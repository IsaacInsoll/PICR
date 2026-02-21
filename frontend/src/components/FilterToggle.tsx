import { useAtom, useAtomValue } from 'jotai';
import { filterAtom, totalFilterOptionsSelected } from '@shared/filterAtom';
import { Badge, Button } from '@mantine/core';
import { useIsMobile } from '../hooks/useIsMobile';
import { FilterIcon } from '../PicrIcons';

export const FilterToggle = ({ disabled }: { disabled?: boolean }) => {
  const [filtering, setFiltering] = useAtom(filterAtom);
  const total = useAtomValue(totalFilterOptionsSelected);
  const isMobile = useIsMobile(); // hide count on mobile as it causes overflow on small viewport sizes

  return (
    <Button
      variant={filtering && !disabled ? 'light' : 'default'}
      disabled={disabled}
      onClick={() => setFiltering((f) => !f)}
      leftSection={<FilterIcon />}
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
