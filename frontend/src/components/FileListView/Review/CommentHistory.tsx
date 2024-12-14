import { Comment } from '../../../../../graphql-types';
import { CommentBodyItem } from './CommentBodyItem';
import { Box, Paper, Timeline } from '@mantine/core';
import { c } from 'vite/dist/node/types.d-aGj9QkWt';

export interface CommentHistoryProps {
  singleFile?: boolean;
  highlight?: string;
}

export const CommentHistory = ({
  comments,
  ...p
}: {
  comments: Comment[];
} & CommentHistoryProps) => {
  return (
    <Timeline active={1} bulletSize={24} lineWidth={2}>
      {comments.map((c) => (
        <CommentBodyItem comment={c} key={c.id} {...p} />
      ))}
    </Timeline>
  );
};
