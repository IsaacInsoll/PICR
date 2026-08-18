import type { AppCommentHistoryCommentFragmentFragment } from '@shared/gql/graphql';
import { CommentBodyItem } from './CommentBodyItem';
import { Group, SegmentedControl, Timeline } from '@mantine/core';
import { atom, useAtom, useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

export interface CommentHistoryProps {
  singleFile?: boolean;
  highlight?: string;
  compact?: boolean;
  limit?: number;
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
  const visibleComments =
    p.limit == null ? sortedComments : sortedComments.slice(0, p.limit);
  return (
    <>
      <Group justify="space-between" gap="xs">
        <CommentFilter compact={p.compact} />
        <CommentSort compact={p.compact} />
      </Group>
      <Timeline active={1} bulletSize={p.compact ? 20 : 24} lineWidth={2}>
        {visibleComments.map((c) => (
          <CommentBodyItem comment={c} key={c.id} {...p} />
        ))}
      </Timeline>
    </>
  );
};

const CommentFilter = ({ compact = false }: { compact?: boolean }) => {
  const { t } = useTranslation('gallery');
  const [value, setValue] = useAtom(commentFilterAtom);
  return (
    <Group>
      <SegmentedControl
        value={value}
        onChange={(next) => setValue(next as CommentFilter)}
        size="xs"
        data={[
          { label: t('comments.all'), value: 'all' },
          {
            label: compact ? t('comments.text') : t('comments.comments'),
            value: 'comments',
          },
          { label: t('comments.ratings'), value: 'ratings' },
        ]}
      />
    </Group>
  );
};
const CommentSort = ({ compact = false }: { compact?: boolean }) => {
  const { t } = useTranslation('gallery');
  const [value, setValue] = useAtom(commentSortAtom);
  return (
    <Group>
      <SegmentedControl
        value={value}
        onChange={(next) => setValue(next as CommentSort)}
        size="xs"
        data={[
          {
            label: compact ? t('comments.newest') : t('comments.newestFirst'),
            value: 'desc',
          },
          {
            label: compact ? t('comments.oldest') : t('comments.oldestFirst'),
            value: 'asc',
          },
        ]}
      />
    </Group>
  );
};

type CommentFilter = 'all' | 'comments' | 'ratings';
const commentFilterAtom = atom<CommentFilter>('all');

type CommentSort = 'desc' | 'asc';
const commentSortAtom = atom<CommentSort>('desc');
