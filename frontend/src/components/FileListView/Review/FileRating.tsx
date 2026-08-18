import { Rating, Tooltip } from '@mantine/core';
import { useId } from 'react';
import { useReward } from 'react-rewards';
import { fiveStarOptions } from './ConfettiOptions';
import { useTranslation } from 'react-i18next';

// 5 star rating, allows clicking current rating to clear it (zero stars)
export const FileRating = ({
  value,
  onChange,
  readOnly,
}: {
  value?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
}) => {
  const { t } = useTranslation('gallery');
  const id = useId();
  const { reward } = useReward(id, 'emoji', fiveStarOptions);

  const handleChange = (r: number) => {
    if (!onChange) return;
    onChange(r === value ? 0 : r);
    if (r !== value && r === 5) reward();
  };

  return (
    <Tooltip label={t('review.rateFile')}>
      <Rating
        id={id}
        value={value}
        onChange={handleChange}
        readOnly={readOnly}
      />
    </Tooltip>
  );
};
