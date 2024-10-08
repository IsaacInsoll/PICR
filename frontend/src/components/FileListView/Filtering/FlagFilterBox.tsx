import { ActionIcon } from '@mantine/core';
import { fileFlags } from '../Review/fileFlagStyles';
import { useAtom } from 'jotai/index';
import { filterOptions } from '../../../atoms/filterAtom';

export const FlagFilterBox = () => {
  const [options, setOptions] = useAtom(filterOptions);

  const selected = options.flag;
  const onChange = (flag: typeof selected) => {
    setOptions((o) => ({ ...o, flag }));
  };

  return (
    <ActionIcon.Group>
      {fileFlags.map(({ icon, value, color }) => {
        const isSelected = selected === value;
        return (
          <ActionIcon
            title={value}
            color={color}
            variant={isSelected ? 'filled' : 'default'}
            onClick={() => onChange(isSelected ? null : value)}
            key={value}
            size="lg"
          >
            {icon}
          </ActionIcon>
        );
      })}
    </ActionIcon.Group>
  );
};
