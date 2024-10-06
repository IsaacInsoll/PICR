import { Divider, Group, Rating } from '@mantine/core';
import { MinimalFile } from '../../../types';
import { FileRatingFlag } from './Filtering/FileRatingFlag';
import { useMutation } from 'urql';
import { CommentButton } from './CommentButton';
import { useSetAtom } from 'jotai/index';
import { commentDialogAtom } from '../../atoms/commentDialogAtom';
import { addCommentMutation } from './AddCommentMutation';
import { useCommentPermissions } from '../../hooks/useCommentPermissions';

export const FileComments = ({ file }: { file: MinimalFile }) => {
  const { commentPermissions, canView, canEdit } = useCommentPermissions();
  if (commentPermissions == 'none') return null;

  const [, mutate] = useMutation(addCommentMutation);
  const { id, flag, rating, totalComments } = file;

  const setComment = useSetAtom(commentDialogAtom);

  // Note when plumbing in mutations:
  //Rating will probably want something like   return <Loader color="blue" size="sm" type="dots" />;
  return (
    <Group gap="xs">
      <FileRatingFlag flag={flag} onChange={(flag) => mutate({ id, flag })} />
      <Divider orientation="vertical" />
      <Rating
        value={rating}
        onChange={(r) => mutate({ id: id, rating: r == rating ? 0 : r })}
      />
      <Divider orientation="vertical" />
      <CommentButton
        totalComments={totalComments}
        onClick={() => setComment({ file: file, open: true })}
      />
    </Group>
  );
};
