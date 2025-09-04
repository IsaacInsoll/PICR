import {
  Box,
  Code,
  Group,
  Paper,
  Rating,
  Stack,
  Text,
  Timeline,
} from '@mantine/core';
import { Comment } from '../../../../../graphql-types';
import { MinimalFile } from '../../../../types';
import { PicrImage } from '../../PicrImage';
import { FileFlagBadge } from './FileFlagBadge';
import { useSetFolder } from '../../../hooks/useSetFolder';
import { useOpenCommentsModal } from '../../../atoms/modalAtom';
import { CommentHistoryProps } from './CommentHistory';
import { PicrAvatar } from '../../PicrAvatar';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { prettyDate } from '@shared/prettyDate';

export const CommentBodyItem = ({
  comment,
  ...p
}: { comment: Comment } & CommentHistoryProps) => {
  const { id, timestamp, user, systemGenerated, file } = comment;
  const setFolder = useSetFolder();
  const openCommentModal = useOpenCommentsModal();

  const showFile = file && !p?.singleFile;

  const openFile = () => {
    setFolder({ id: file.folderId }, file);
  };

  const isHighlighted = p?.highlight == id;
  const isMobile = useIsMobile();

  // We could use the 'title' prop on `Item` but it's a huge font size
  return (
    <Timeline.Item
      // bullet={<LazyPicrAvatar size={24} userId={userId} />}
      bullet={<PicrAvatar size={24} user={user} />}
      lineVariant={systemGenerated ? 'dashed' : 'solid'}
    >
      <Paper
        withBorder={isHighlighted}
        p={isHighlighted ? 'sm' : undefined}
        shadow={isHighlighted ? 'xl' : undefined}
      >
        <Group
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'flex-start',
          }}
        >
          {showFile ? (
            <FilePreview
              file={file}
              onClick={() => openCommentModal(file.id, id)}
            />
          ) : null}
          <Stack style={{ flexGrow: 1 }} gap="xs">
            <Text size="xs" c="dimmed" fw={500}>
              {user?.name}
            </Text>
            {systemGenerated ? (
              <CommentAction comment={comment} />
            ) : (
              <Text size="sm">{comment.comment}</Text>
            )}
            <Group>
              {showFile ? (
                <Code style={{ opacity: 0.33 }}>{file?.name}</Code>
              ) : null}
              <Text c="dimmed" size="xs">
                {prettyDate(timestamp)}
              </Text>
            </Group>
          </Stack>
        </Group>
      </Paper>
    </Timeline.Item>
  );
};

const FilePreview = ({
  file,
  onClick,
}: {
  file: MinimalFile;
  onClick?: () => void;
}) => {
  return (
    <Box>
      {
        file.type == 'Image' ? (
          <PicrImage
            onClick={onClick}
            clickable={true}
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
