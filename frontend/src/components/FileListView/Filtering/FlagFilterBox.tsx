import { Button } from '@mantine/core';
import { fileFlags } from '../Review/fileFlagStyles';
import type { GalleryFilterCriteria } from '@shared/files/mediaCriteria';
import { useTranslation } from 'react-i18next';

export const FlagFilterBox = ({
  filters,
  onChange,
}: {
  filters: GalleryFilterCriteria;
  onChange: (filters: GalleryFilterCriteria) => void;
}) => {
  const { t } = useTranslation('gallery');

  const selected = filters.flag;
  const onFlagChange = (flag: typeof selected) => {
    onChange({ ...filters, flag });
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
            onClick={() => onFlagChange(isSelected ? null : value)}
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
