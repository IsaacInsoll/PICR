import { ActionIcon, Indicator } from '@mantine/core';
import { BiComment, BiCommentDetail } from 'react-icons/bi';

// A button showing total comments, click to view/add comments
export const CommentButton = ({
  totalComments,
  onClick,
}: {
  totalComments: number;
  onClick: () => void;
}) => {
  return (
    <Indicator
      inline
      label={totalComments}
      size={16}
      disabled={!totalComments || totalComments == 0}
    >
      <ActionIcon variant="default" onClick={onClick}>
        {totalComments == 0 ? <BiComment /> : <BiCommentDetail />}
      </ActionIcon>
    </Indicator>
  );
};
