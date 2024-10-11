import { Comment } from '../../../../../graphql-types';
import { Group, Rating, Stack, Text, Timeline } from '@mantine/core';
import { CiLight } from 'react-icons/ci';
import { prettyDate } from '../Filtering/PrettyDate';
import { FileFlagBadge, FileFlagChip } from './FileFlagBadge';

export const CommentBodyItem = ({ comment }: { comment: Comment }) => {
  const { id, timestamp, userId, systemGenerated } = comment;

  // We could use the 'title' prop on `Item` but it's a huge font size
  return (
    <Timeline.Item bullet={<CiLight size={12} />}>
      {systemGenerated ? (
        <CommentAction comment={comment} />
      ) : (
        <Text size="sm">{comment.comment}</Text>
      )}
      <Text c="dimmed" size="xs" mt={4}>
        {prettyDate(timestamp)}
      </Text>
    </Timeline.Item>
  );
};

const CommentAction = ({ comment }: { comment: Comment }) => {
  const json = JSON.parse(comment?.comment);
  if (!json) return null;
  return (
    <Stack>
      {json.rating != null ? (
        <Group gap="xs">
          <Text size="xs">Rating</Text>
          <Rating
            value={json.rating}
            readOnly
            size="xs"
            style={{ opacity: 0.66 }}
          />
        </Group>
      ) : null}
      {json.flag ? (
        <Group gap="xs">
          <Text size="xs">Flag</Text>
          <FileFlagBadge flag={json.flag} />
        </Group>
      ) : null}
    </Stack>
  );
};
