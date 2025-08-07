import { Button } from '@mantine/core';
import { fileFlags } from '../Review/fileFlagStyles';
import { useAtom } from 'jotai/index';
import { filterOptions } from '@shared/filterAtom';

export const FlagFilterBox = () => {
  const [options, setOptions] = useAtom(filterOptions);

  const selected = options.flag;
  const onChange = (flag: typeof selected) => {
    setOptions((o) => ({ ...o, flag }));
  };

  return (
    <Button.Group>
      {fileFlags.map(({ icon, value, color, label }) => {
        const isSelected = selected === value;
        return (
          <Button
            style={{ flexGrow: 1 }}
            title={value}
            color={color}
            variant={isSelected ? 'filled' : 'default'}
            onClick={() => onChange(isSelected ? null : value)}
            key={value}
            size="xs"
            leftSection={icon}
          >
            {label}
          </Button>
        );
      })}
    </Button.Group>
  );
};
