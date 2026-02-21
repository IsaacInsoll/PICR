import { ActionIcon, Group } from '@mantine/core';
import { useAtom } from 'jotai';
import {
  FilterOptionsInterface,
  filterOptions,
  RatingsComparisonOptions,
} from '@shared/filterAtom';
import { ReactNode } from 'react';
import {
  EqualIcon,
  GreaterThanEqualIcon,
  LessThanEqualIcon,
} from '../../../PicrIcons';
import { FileRating } from '../Review/FileRating';

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
  return (
    <ActionIcon.Group>
      {options.map(({ title, icon }) => {
        const isSelected = title === value;
        return (
          <ActionIcon
            title={title}
            variant={isSelected ? 'filled' : 'default'}
            onClick={() => onChange(isSelected ? null : title)}
            key={title}
            size="md"
          >
            {icon}
          </ActionIcon>
        );
      })}
    </ActionIcon.Group>
  );
};

const options: { title: RatingsComparisonOptions; icon: ReactNode }[] = [
  { title: 'lessThan', icon: <LessThanEqualIcon /> },
  { title: 'equal', icon: <EqualIcon /> },
  { title: 'greaterThan', icon: <GreaterThanEqualIcon /> },
];
