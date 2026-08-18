import { Button } from '@mantine/core';
import { fileFlags } from '../Review/fileFlagStyles';
import { useAtom } from 'jotai';
import type { FilterOptionsInterface } from '@shared/filterAtom';
import { filterOptions } from '@shared/filterAtom';
import { useTranslation } from 'react-i18next';

export const FlagFilterBox = () => {
  const { t } = useTranslation('gallery');
  const [options, setOptions] = useAtom(filterOptions);

  const selected = options.flag;
  const onChange = (flag: typeof selected) => {
    setOptions((o: FilterOptionsInterface) => ({ ...o, flag }));
  };

  return (
    <Button.Group>
      {fileFlags.map(({ icon, value, color, labelKey }) => {
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
            {t(labelKey)}
          </Button>
        );
      })}
    </Button.Group>
  );
};
