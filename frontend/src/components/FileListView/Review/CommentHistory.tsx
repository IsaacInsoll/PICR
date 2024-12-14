import { Comment } from '../../../../../graphql-types';
import { CommentBodyItem } from './CommentBodyItem';
import { Box, Group, Paper, SegmentedControl, Timeline } from '@mantine/core';
import { c } from 'vite/dist/node/types.d-aGj9QkWt';
import { useState } from 'react';
import { atom, useAtom } from 'jotai/index';
import { useAtomValue } from 'jotai';

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
  const filter = useAtomValue(commentFilterAtom);
  const sort = useAtomValue(commentSortAtom);
  const filteredComments = comments.filter((c) => {
    if (filter == 'all') return true;
    if (filter == 'comments') return !c.systemGenerated;
    if (filter == 'ratings') return c.systemGenerated;
  });
  const sortedComments =
    sort == 'desc' ? filteredComments : filteredComments.toReversed();
  return (
    <>
      <Group justify="space-between">
        <CommentFilter />
        <CommentSort />
      </Group>
      <Timeline active={1} bulletSize={24} lineWidth={2}>
        {sortedComments.map((c) => (
          <CommentBodyItem comment={c} key={c.id} {...p} />
        ))}
      </Timeline>
    </>
  );
};

const CommentFilter = () => {
  const [value, setValue] = useAtom(commentFilterAtom);
  return (
    <Group>
      <SegmentedControl
        value={value}
        onChange={setValue}
        size="xs"
        data={[
          { label: 'All', value: 'all' },
          { label: 'Comments', value: 'comments' },
          { label: 'Ratings', value: 'ratings' },
        ]}
      />
    </Group>
  );
};
const CommentSort = () => {
  const [value, setValue] = useAtom(commentSortAtom);
  return (
    <Group>
      <SegmentedControl
        value={value}
        onChange={setValue}
        size="xs"
        data={[
          { label: 'Newest First', value: 'desc' },
          { label: 'Oldest First', value: 'asc' },
        ]}
      />
    </Group>
  );
};

type CommentFilter = 'all' | 'comments' | 'ratings';
const commentFilterAtom = atom<CommentFilter>('all');

type CommentSort = 'desc' | 'asc';
const commentSortAtom = atom<CommentSort>('desc');
