import { Divider, Group, Tooltip } from '@mantine/core';
import { MinimalFile } from '../../../../types';
import { FileFlagButtons } from './FileFlagButtons';
import { useMutation } from 'urql';
import { CommentButton } from './CommentButton';
import { useOpenCommentsModal } from '../../../atoms/modalAtom';
import { addCommentMutation } from './addCommentMutation';
import { useCommentPermissions } from '../../../hooks/useCommentPermissions';
import { FileFlagBadge } from './FileFlagBadge';
import { FileRating } from './FileRating';

// Horizontal component containing Flag, Rating and Comment buttons
export const FileReview = ({ file }: { file: MinimalFile }) => {
  const { readOnly, isNone } = useCommentPermissions();
  if (isNone) return null;

  const [, mutate] = useMutation(addCommentMutation);
  const { id, flag, rating, totalComments } = file;

  const openComment = useOpenCommentsModal();

  // Note when plumbing in mutations:
  //Rating will probably want something like   return <Loader color="blue" size="sm" type="dots" />;
  return (
    <Group gap="xs">
      {readOnly ? (
        <FileFlagBadge flag={flag} hideIfNone={true} />
      ) : (
        <FileFlagButtons
          flag={flag}
          onChange={(flag) => mutate({ id, flag })}
        />
      )}
      <Divider orientation="vertical" />
      <FileRating
        value={rating}
        onChange={(rating) => mutate({ id, rating })}
        readOnly={readOnly}
      />
      <Divider orientation="vertical" />
      <CommentButton
        totalComments={totalComments}
        onClick={() => openComment(file)}
      />
    </Group>
  );
};
