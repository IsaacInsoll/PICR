import { ActionIcon, Indicator, Tooltip } from '@mantine/core';
import { CommentIcon, CommentsIcon } from '../../../PicrIcons';
import type { ReviewButtonVariant } from './FileReview';
import { useTranslation } from 'react-i18next';

// A button showing total comments, click to view/add comments
export const CommentButton = ({
  totalComments,
  onClick,
  variant = 'default',
}: {
  totalComments: number;
  onClick: () => void;
  variant?: ReviewButtonVariant;
}) => {
  const { t } = useTranslation('gallery');
  return (
    <Indicator
      inline
      label={totalComments}
      size={16}
      disabled={!totalComments || totalComments === 0}
    >
      <Tooltip label={t('count.comment', { count: totalComments })}>
        <ActionIcon variant={variant} onClick={onClick}>
          {totalComments === 0 ? <CommentIcon /> : <CommentsIcon />}
        </ActionIcon>
      </Tooltip>
    </Indicator>
  );
};
