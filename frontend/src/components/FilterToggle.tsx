import { useAtom, useAtomValue } from 'jotai/index';
import { filterAtom, totalFilterOptionsSelected } from '../atoms/filterAtom';
import { Button } from 'grommet';
import { Filter } from 'grommet-icons';

export const FilterToggle = ({ disabled }: { disabled?: boolean }) => {
  const [filtering, setFiltering] = useAtom(filterAtom);
  const total = useAtomValue(totalFilterOptionsSelected);
  return (
    <Button
      icon={<Filter />}
      primary={filtering && !disabled}
      disabled={disabled}
      onClick={() => setFiltering((f) => !f)}
      badge={filtering ? total : undefined}
    />
  );
};
