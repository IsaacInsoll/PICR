import { ActionIcon, Group } from '@mantine/core';
import { useAtom } from 'jotai';
import type {
  FilterOptionsInterface,
  RatingsComparisonOptions,
} from '@shared/filterAtom';
import { filterOptions } from '@shared/filterAtom';
import type { ReactNode } from 'react';
import {
  EqualIcon,
  GreaterThanEqualIcon,
  LessThanEqualIcon,
} from '../../../PicrIcons';
import { FileRating } from '../Review/FileRating';
import { useTranslation } from 'react-i18next';

export const RatingFilterBox = () => {
  const [options, setOptions] = useAtom(filterOptions);

  return (
    <Group gap="sm">
      <RatingComparisonSelector
        value={options.ratingComparison}
        onChange={(ratingComparison: RatingsComparisonOptions | null) =>
          setOptions((o: FilterOptionsInterface) => ({
            ...o,
            ratingComparison,
            // rating: ratingComparison ? o.rating : 0,
          }))
        }
      />
      <FileRating
        value={options.ratingComparison ? options.rating : 0}
        onChange={(rating: number) =>
          setOptions((o: FilterOptionsInterface) => ({
            ...o,
            rating,
            ratingComparison: o.ratingComparison ?? 'equal',
          }))
        }
      />
    </Group>
  );
};

const RatingComparisonSelector = ({
  value,
  onChange,
}: {
  value: RatingsComparisonOptions | null;
  onChange: (v: RatingsComparisonOptions | null) => void;
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
  value: RatingsComparisonOptions;
  labelKey:
    | 'filter.ratingComparison.lessThan'
    | 'filter.ratingComparison.equal'
    | 'filter.ratingComparison.greaterThan';
  icon: ReactNode;
}[] = [
  {
    value: 'lessThan',
    labelKey: 'filter.ratingComparison.lessThan',
    icon: <LessThanEqualIcon />,
  },
  {
    value: 'equal',
    labelKey: 'filter.ratingComparison.equal',
    icon: <EqualIcon />,
  },
  {
    value: 'greaterThan',
    labelKey: 'filter.ratingComparison.greaterThan',
    icon: <GreaterThanEqualIcon />,
  },
];
