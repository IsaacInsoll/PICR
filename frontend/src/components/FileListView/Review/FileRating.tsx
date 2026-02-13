import { Rating, RatingProps, Tooltip } from '@mantine/core';
import { useId } from 'react';
import { useReward } from 'react-rewards';
import { fiveStarOptions } from './ConfettiOptions';

// 5 star rating, allows clicking current rating to clear it (zero stars)
export const FileRating = ({ value, onChange, readOnly }: RatingProps) => {
  const id = useId();
  const { reward } = useReward(id, 'emoji', fiveStarOptions);

  const handleChange = (r: number) => {
    onChange(r == value ? 0 : r);
    if (r != value && r == 5) reward();
  };

  return (
    <Tooltip label={`Rate this file`}>
      <Rating
        id={id}
        value={value}
        onChange={handleChange}
        readOnly={readOnly}
      />
    </Tooltip>
  );
};
