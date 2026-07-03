import type { AppCommentHistoryCommentFragmentFragment } from '@shared/gql/graphql';
import { CommentBodyItem } from './CommentBodyItem';
import { Group, SegmentedControl, Timeline } from '@mantine/core';
import { atom, useAtom, useAtomValue } from 'jotai';

export interface CommentHistoryProps {
  singleFile?: boolean;
  highlight?: string;
  // Render each comment without its own Paper surface, so it blends into a
  // parent card (used on the dashboard feedback feed).
  flat?: boolean;
  // Dashboard comments are shown outside their folder, so file links need to
  // navigate to the owning folder before opening the comment modal.
  showFolderContext?: boolean;
}

export const CommentHistory = ({
  comments,
  ...p
}: {
  comments: AppCommentHistoryCommentFragmentFragment[];
} & CommentHistoryProps) => {
  const filter = useAtomValue(commentFilterAtom);
  const sort = useAtomValue(commentSortAtom);
  const filteredComments = comments.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'comments') return !c.systemGenerated;
    return c.systemGenerated;
  });
  const sortedComments =
    sort === 'desc' ? filteredComments : filteredComments.toReversed();
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
        onChange={(next) => setValue(next as CommentFilter)}
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
        onChange={(next) => setValue(next as CommentSort)}
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
