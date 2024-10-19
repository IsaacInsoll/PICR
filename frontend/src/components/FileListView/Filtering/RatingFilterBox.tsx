import { ActionIcon, Group } from '@mantine/core';
import { useAtom } from 'jotai/index';
import {
  filterOptions,
  RatingsComparisonOptions,
} from '../../../atoms/filterAtom';
import { ReactNode } from 'react';
import { TbEqual, TbMathEqualGreater, TbMathEqualLower } from 'react-icons/tb';
import { FileRating } from '../Review/FileRating';

export const RatingFilterBox = () => {
  const [options, setOptions] = useAtom(filterOptions);

  return (
    <Group gap="sm">
      <RatingComparisonSelector
        value={options.ratingComparison}
        onChange={(ratingComparison) =>
          setOptions((o) => ({
            ...o,
            ratingComparison,
            // rating: ratingComparison ? o.rating : 0,
          }))
        }
      />
      <FileRating
        value={options.ratingComparison ? options.rating : 0}
        onChange={(rating) =>
          setOptions((o) => ({
            ...o,
            rating,
            ratingComparison: o.ratingComparison ?? 'equal',
          }))
        }
      />
    </Group>
  );
};

const RatingComparisonSelector = ({ value, onChange }) => {
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
  { title: 'lessThan', icon: <TbMathEqualLower /> },
  { title: 'equal', icon: <TbEqual /> },
  { title: 'greaterThan', icon: <TbMathEqualGreater /> },
];
