import { ActionIcon, Group } from '@mantine/core';
import type {
  GalleryFilterCriteria,
  RatingComparison,
} from '@shared/files/mediaCriteria';
import type { ReactNode } from 'react';
import {
  EqualIcon,
  GreaterThanEqualIcon,
  LessThanEqualIcon,
} from '../../../PicrIcons';
import { FileRating } from '../Review/FileRating';
import { useTranslation } from 'react-i18next';

export const RatingFilterBox = ({
  filters,
  onChange,
}: {
  filters: GalleryFilterCriteria;
  onChange: (filters: GalleryFilterCriteria) => void;
}) => {
  return (
    <Group gap="sm">
      <RatingComparisonSelector
        value={filters.ratingComparison}
        onChange={(ratingComparison: RatingComparison | null) =>
          onChange({
            ...filters,
            ratingComparison,
          })
        }
      />
      <FileRating
        value={filters.ratingComparison ? filters.rating : 0}
        onChange={(rating: number) =>
          onChange({
            ...filters,
            rating,
            ratingComparison: filters.ratingComparison ?? 'equal',
          })
        }
      />
    </Group>
  );
};

const RatingComparisonSelector = ({
  value,
  onChange,
}: {
  value: RatingComparison | null;
  onChange: (v: RatingComparison | null) => void;
}) => {
  const { t } = useTranslation('gallery');
  return (
    <ActionIcon.Group>
      {options.map(({ value: optionValue, labelKey, icon }) => {
        const isSelected = optionValue === value;
        return (
          <ActionIcon
            title={t(labelKey)}
            variant={isSelected ? 'filled' : 'default'}
            onClick={() => onChange(isSelected ? null : optionValue)}
            key={optionValue}
            size="md"
          >
            {icon}
          </ActionIcon>
        );
      })}
    </ActionIcon.Group>
  );
};

const options: {
  value: RatingComparison;
  labelKey:
    | 'filter.ratingComparison.atMost'
    | 'filter.ratingComparison.equal'
    | 'filter.ratingComparison.atLeast';
  icon: ReactNode;
}[] = [
  {
    value: 'atMost',
    labelKey: 'filter.ratingComparison.atMost',
    icon: <LessThanEqualIcon />,
  },
  {
    value: 'equal',
    labelKey: 'filter.ratingComparison.equal',
    icon: <EqualIcon />,
  },
  {
    value: 'atLeast',
    labelKey: 'filter.ratingComparison.atLeast',
    icon: <GreaterThanEqualIcon />,
  },
];
