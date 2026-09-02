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
import { useOpenCommentsModal } from '../../../hooks/useFileModalNavigation';
import type { CommentHistoryProps } from './CommentHistory';
import { PicrAvatar } from '../../PicrAvatar';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { PicrLink } from '../../PicrLink';
import { useBaseViewFolderURL } from '../../../hooks/useBaseViewFolderURL';
import { PrettyFolderPath } from '../../PrettyFolderPath';
import { useTranslation } from 'react-i18next';
import { useDateFormatters } from '../../../i18n/useDateFormatters';
import { useFolderNameFormatter } from '../../../i18n/useFolderNameFormatter';
import type { NavLinkProps } from 'react-router';
import { useFileModalLink } from '../../../hooks/useFileModalLink';

type FileModalLinkProps = Pick<NavLinkProps, 'to' | 'replace' | 'state'>;

export const CommentBodyItem = ({
  comment,
  ...p
}: {
  comment: AppCommentHistoryCommentFragmentFragment;
} & CommentHistoryProps) => {
  const { t } = useTranslation('gallery');
  const { id, timestamp, user, systemGenerated, file } = comment;
  const openCommentModal = useOpenCommentsModal();
  const { prettyDate } = useDateFormatters();
  const displayUser = user ?? { id: 'system', name: t('comments.system') };
  const baseFolderUrl = useBaseViewFolderURL();
  const modalLink = useFileModalLink({
    mode: 'comments',
    fileId: file?.id ?? '',
    highlight: id ?? undefined,
  });

  const showFile = file && !p.singleFile;
  const commentLink = p.showFolderContext && file ? modalLink : undefined;
  const folderLink =
    p.showFolderContext && file?.folder
      ? `${baseFolderUrl}${file.folder.id}`
      : undefined;

  const isHighlighted = p.highlight === id;
  const isMobile = useIsMobile();
  const compact = Boolean(p.compact);
  const openFileComment = () => {
    if (!file) return;
    openCommentModal(file.id, id ?? undefined);
  };
  const showFilePreview = showFile && !compact;

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
          {showFilePreview ? (
            <FilePreview
              file={file as PicrFile}
              onClick={commentLink ? undefined : openFileComment}
              link={commentLink}
            />
          ) : null}
          <Stack style={{ flexGrow: 1 }} gap="xs">
            <Text size="xs" c="dimmed" fw={500}>
              {displayUser.name}
            </Text>
            {systemGenerated ? (
              commentLink ? (
                <PicrLink
                  {...commentLink}
                  c="inherit"
                  underline="never"
                  aria-label={t('comments.viewFeedback')}
                >
                  <CommentAction comment={comment} />
                </PicrLink>
              ) : (
                <CommentAction comment={comment} />
              )
            ) : commentLink ? (
              <PicrLink {...commentLink} c="inherit" underline="never">
                <Text size="sm" lineClamp={compact ? 2 : undefined}>
                  {comment.comment}
                </Text>
              </PicrLink>
            ) : (
              <Text size="sm" lineClamp={compact ? 2 : undefined}>
                {comment.comment}
              </Text>
            )}
            <Group>
              {showFile ? (
                <FileContext
                  file={file as PicrFile}
                  link={commentLink}
                  folderLink={folderLink}
                  inFolderLabel={t('comments.inFolder')}
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
  link,
}: {
  file: PicrFile;
  onClick?: () => void;
  link?: FileModalLinkProps;
}) => {
  const image =
    file.type === 'Image' ? (
      <PicrImage
        onClick={onClick}
        clickable={Boolean(onClick) || Boolean(link)}
        file={file}
        targetWidth={Math.ceil(96 * (file.imageRatio ?? 1))}
        sizes={`${Math.ceil(96 * (file.imageRatio ?? 1))}px`}
        style={{
          width: 96 * (file.imageRatio ?? 1),
          height: 80,
        }}
      />
    ) : null;

  return (
    <Box>
      {link && image ? (
        <PicrLink {...link} tabIndex={-1}>
          {image}
        </PicrLink>
      ) : (
        image
      )}
    </Box>
  );
};

const FileContext = ({
  file,
  link,
  folderLink,
  inFolderLabel,
}: {
  file: PicrFile;
  link?: FileModalLinkProps;
  folderLink?: string;
  inFolderLabel: string;
}) => {
  const formatFolderName = useFolderNameFormatter();
  const fileName = (
    <Code style={{ opacity: 0.33 }}>{normalizeDisplayName(file.name)}</Code>
  );

  if (!link) return fileName;

  return (
    <Group gap={4}>
      <PicrLink {...link} underline="never">
        {fileName}
      </PicrLink>
      {file.folder ? (
        <>
          <Text c="dimmed" size="xs">
            {inFolderLabel}
          </Text>
          <Tooltip
            withArrow
            color="blue.9"
            disabled={file.folder.parents?.length === 0}
            label={<PrettyFolderPath folder={file.folder} subColor="blue.8" />}
          >
            <PicrLink to={folderLink ?? link.to} underline="never">
              <Code style={{ opacity: 0.33 }}>
                {formatFolderName(file.folder)}
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
  const { t } = useTranslation('gallery');
  if (!comment.comment) return null;
  const json = JSON.parse(comment.comment) as {
    rating?: number;
    flag?: string;
  };
  return (
    <Stack>
      {json.rating != null ? (
        <Group gap="xs">
          <Text size="xs">{t('review.rating')}</Text>
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
          <Text size="xs">{t('review.flag')}</Text>
          <FileFlagBadge flag={json.flag} />
        </Group>
      ) : null}
    </Stack>
  );
};
