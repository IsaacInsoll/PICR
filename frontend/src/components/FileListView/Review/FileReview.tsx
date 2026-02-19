import { Divider, Group } from '@mantine/core';
import { PicrFile } from '../../../../types';
import { FileFlagButtons } from './FileFlagButtons';
import { useMutation } from 'urql';
import { CommentButton } from './CommentButton';
import { useOpenCommentsModal } from '../../../atoms/modalAtom';
import { addCommentMutation } from '@shared/urql/mutations/addCommentMutation';
import { useCommentPermissions } from '../../../hooks/useCommentPermissions';
import { FileFlagBadge } from './FileFlagBadge';
import { FileRating } from './FileRating';
import { SetHeroImageButton } from './SetHeroImageButton';
import { FileFlag } from '../../../../../graphql-types';

// Horizontal component containing Flag, Rating and Comment buttons
export const FileReview = ({ file }: { file: PicrFile }) => {
  const { readOnly, isNone } = useCommentPermissions();
  const [, mutate] = useMutation(addCommentMutation);
  const openComment = useOpenCommentsModal();

  if (isNone) return null;

  const { id, flag, rating, totalComments } = file;

  // Note when plumbing in mutations:
  //Rating will probably want something like   return <Loader color="blue" size="sm" type="dots" />;
  return (
    <Group gap="xs">
      {readOnly ? (
        <FileFlagBadge flag={flag ?? FileFlag.None} hideIfNone={true} />
      ) : (
        <FileFlagButtons
          flag={flag ?? FileFlag.None}
          onChange={(flag) => mutate({ id, flag })}
        />
      )}
      <Divider orientation="vertical" />
      <FileRating
        value={rating ?? 0}
        onChange={(rating) => mutate({ id, rating })}
        readOnly={readOnly}
      />
      <Divider orientation="vertical" />
      <CommentButton
        totalComments={totalComments ?? 0}
        onClick={() => openComment(file.id)}
      />
      <SetHeroImageButton file={file} />
    </Group>
  );
};
