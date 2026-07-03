import {
  Box,
  Code,
  Group,
  Paper,
  Rating,
  Stack,
  Text,
  Timeline,
  Tooltip,
} from '@mantine/core';
import { normalizeDisplayName } from '@shared/displayName';
import type { AppCommentHistoryCommentFragmentFragment } from '@shared/gql/graphql';
import { FileFlag } from '@shared/gql/graphql';
import type { PicrFile } from '@shared/types/picr';
import { PicrImage } from '../../PicrImage';
import { FileFlagBadge } from './FileFlagBadge';
import { useOpenCommentsModal } from '../../../atoms/modalAtom';
import type { CommentHistoryProps } from './CommentHistory';
import { PicrAvatar } from '../../PicrAvatar';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { prettyDate } from '@shared/prettyDate';
import { PicrLink } from '../../PicrLink';
import { useBaseViewFolderURL } from '../../../hooks/useBaseViewFolderURL';
import { PrettyFolderPath } from '../../PrettyFolderPath';

export const CommentBodyItem = ({
  comment,
  ...p
}: {
  comment: AppCommentHistoryCommentFragmentFragment;
} & CommentHistoryProps) => {
  const { id, timestamp, user, systemGenerated, file } = comment;
  const openCommentModal = useOpenCommentsModal();
  const displayUser = user ?? { id: 'system', name: 'System' };
  const baseFolderUrl = useBaseViewFolderURL();

  const showFile = file && !p.singleFile;
  const commentLink =
    p.showFolderContext && file?.folder
      ? `${baseFolderUrl}${file.folder.id}#m=comments-${file.id}${
          id ? `-${id}` : ''
        }`
      : undefined;
  const folderLink =
    p.showFolderContext && file?.folder
      ? `${baseFolderUrl}${file.folder.id}`
      : undefined;

  const isHighlighted = p.highlight === id;
  const isMobile = useIsMobile();
  const openFileComment = () => {
    if (!file || !id) return;
    openCommentModal(file.id, id);
  };

  // We could use the 'title' prop on `Item` but it's a huge font size
  return (
    <Timeline.Item
      // bullet={<LazyPicrAvatar size={24} userId={userId} />}
      bullet={<PicrAvatar size={24} user={displayUser} />}
      lineVariant={systemGenerated ? 'dashed' : 'solid'}
    >
      <Paper
        withBorder={isHighlighted}
        bg={p.flat && !isHighlighted ? 'transparent' : undefined}
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
              file={file as PicrFile}
              onClick={commentLink ? undefined : openFileComment}
              linkTo={commentLink}
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
                <FileContext
                  file={file as PicrFile}
                  linkTo={commentLink}
                  folderLink={folderLink}
                />
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
  linkTo,
}: {
  file: PicrFile;
  onClick?: () => void;
  linkTo?: string;
}) => {
  const image =
    file.type === 'Image' ? (
      <PicrImage
        onClick={onClick}
        clickable={Boolean(onClick) || Boolean(linkTo)}
        file={file}
        size="sm"
        style={{
          width: 96 * (file.imageRatio ?? 1),
          height: 80,
        }}
      />
    ) : null;

  return (
    <Box>
      {linkTo && image ? <PicrLink to={linkTo}>{image}</PicrLink> : image}
    </Box>
  );
};

const FileContext = ({
  file,
  linkTo,
  folderLink,
}: {
  file: PicrFile;
  linkTo?: string;
  folderLink?: string;
}) => {
  const fileName = (
    <Code style={{ opacity: 0.33 }}>{normalizeDisplayName(file.name)}</Code>
  );

  if (!linkTo) return fileName;

  return (
    <Group gap={4}>
      <PicrLink to={linkTo} underline="never">
        {fileName}
      </PicrLink>
      {file.folder ? (
        <>
          <Text c="dimmed" size="xs">
            in
          </Text>
          <Tooltip
            withArrow
            color="blue.9"
            disabled={file.folder.parents?.length === 0}
            label={<PrettyFolderPath folder={file.folder} subColor="blue.8" />}
          >
            <PicrLink to={folderLink ?? linkTo} underline="never">
              <Code style={{ opacity: 0.33 }}>
                {normalizeDisplayName(file.folder.name)}
              </Code>
            </PicrLink>
          </Tooltip>
        </>
      ) : null}
    </Group>
  );
};

const isFileFlag = (value: string): value is FileFlag =>
  value === FileFlag.Approved ||
  value === FileFlag.Rejected ||
  value === FileFlag.None;

const CommentAction = ({
  comment,
}: {
  comment: AppCommentHistoryCommentFragmentFragment;
}) => {
  if (!comment.comment) return null;
  const json = JSON.parse(comment.comment) as {
    rating?: number;
    flag?: string;
  };
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
      {json.flag && isFileFlag(json.flag) ? (
        <Group gap="xs">
          <Text size="xs">Flag</Text>
          <FileFlagBadge flag={json.flag} />
        </Group>
      ) : null}
    </Stack>
  );
};
