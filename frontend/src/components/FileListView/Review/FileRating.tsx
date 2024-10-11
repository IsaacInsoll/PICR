import { Rating, RatingProps } from '@mantine/core';

// 5 star rating, allows clicking current rating to clear it (zero stars)
export const FileRating = ({ value, onChange, readOnly }: RatingProps) => {
  return (
    <Rating
      value={value}
      onChange={(r) => onChange(r == value ? 0 : r)}
      readOnly={readOnly}
    />
  );
};
