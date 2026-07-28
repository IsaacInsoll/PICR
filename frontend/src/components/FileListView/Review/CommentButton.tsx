import { ActionIcon, Indicator, Tooltip } from '@mantine/core';
import { CommentIcon, CommentsIcon } from '../../../PicrIcons';
import type { ReviewButtonVariant } from './FileReview';

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
  return (
    <Indicator
      inline
      label={totalComments}
      size={16}
      disabled={!totalComments || totalComments === 0}
    >
      <Tooltip
        label={`${totalComments} Comment` + (totalComments !== 1 ? 's' : '')}
      >
        <ActionIcon variant={variant} onClick={onClick}>
          {totalComments === 0 ? <CommentIcon /> : <CommentsIcon />}
        </ActionIcon>
      </Tooltip>
    </Indicator>
  );
};
