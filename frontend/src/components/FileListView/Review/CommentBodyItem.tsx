import { Box, Code, Group, Rating, Stack, Text, Timeline } from '@mantine/core';
import { Comment } from '../../../../../graphql-types';
import { MinimalFile } from '../../../../types';
import { PicrImage } from '../../PicrImage';
import { prettyDate } from '../Filtering/PrettyDate';
import { FileFlagBadge } from './FileFlagBadge';
import { LazyPicrAvatar } from '../../LazyPicrAvatar';

export const CommentBodyItem = ({ comment }: { comment: Comment }) => {
  const { id, timestamp, userId, systemGenerated, file } = comment;

  // We could use the 'title' prop on `Item` but it's a huge font size
  // Bullet should be user avatar
  return (
    <Timeline.Item
      bullet={<LazyPicrAvatar size={24} userId={userId} />}
      lineVariant={systemGenerated ? 'dashed' : 'solid'}
    >
      <Group>
        {file ? <FilePreview file={file} /> : null}
        <Stack style={{ flexGrow: 1 }} gap="xs">
          {systemGenerated ? (
            <CommentAction comment={comment} />
          ) : (
            <Text size="sm">{comment.comment}</Text>
          )}
          <Group>
            <Code style={{ opacity: 0.33 }}>{file.name}</Code>
            <Text c="dimmed" size="xs">
              {prettyDate(timestamp)}
            </Text>
          </Group>
        </Stack>
      </Group>
    </Timeline.Item>
  );
};

const FilePreview = ({ file }: { file: MinimalFile }) => {
  return (
    <Box>
      {
        file.type == 'Image' ? (
          <PicrImage
            file={file}
            size="sm"
            style={{
              width: 96 * (file.imageRatio ?? 1),
              height: 80,
            }}
          />
        ) : null // <Code>{file.name}</Code>
      }
    </Box>
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
