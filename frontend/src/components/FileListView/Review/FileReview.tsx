import { Divider, Group } from '@mantine/core';
import type { PicrFile } from '@shared/types/picr';
import { FileFlagButtons } from './FileFlagButtons';
import { useMutation } from 'urql';
import { CommentButton } from './CommentButton';
import { useOpenCommentsModal } from '../../../atoms/modalAtom';
import { addCommentMutation } from '@shared/urql/mutations/addCommentMutation';
import { useCommentPermissions } from '../../../hooks/useCommentPermissions';
import { FileFlagBadge } from './FileFlagBadge';
import { FileRating } from './FileRating';
import { SetHeroImageButton } from './SetHeroImageButton';
import { FileFlag } from '@shared/gql/graphql';

export type ReviewableFile = Pick<
  PicrFile,
  | 'id'
  | 'flag'
  | 'rating'
  | 'totalComments'
  | 'type'
  | 'folderId'
  | 'isHeroImage'
  | 'isBannerImage'
>;

// Variant for the *inactive* review buttons. Grid and list views use `default`
// (bordered), the lightbox uses `subtle` so the controls don't sit in boxes over
// the photograph. Active states stay `filled` either way — that background is
// what communicates the state.
export type ReviewButtonVariant = 'default' | 'subtle';

// Horizontal component containing Flag, Rating and Comment buttons
export const FileReview = ({
  file,
  variant = 'default',
}: {
  file: ReviewableFile;
  variant?: ReviewButtonVariant;
}) => {
  const { readOnly, isNone } = useCommentPermissions();
  const [, mutate] = useMutation(addCommentMutation);
  const openComment = useOpenCommentsModal();

  if (isNone) return null;

  const { id, flag, rating, totalComments } = file;
  const handleFlagChange = (flag: FileFlag) => {
    void mutate({ id, flag });
  };
  const handleRatingChange = (rating: number) => {
    void mutate({ id, rating });
  };

  // Note when plumbing in mutations:
  //Rating will probably want something like   return <Loader color="blue" size="sm" type="dots" />;
  return (
    // Borderless buttons need less separation than bordered ones: with no box
    // edges to read against, `xs` leaves the row looking gappy. 2px matches the
    // lightbox toolbar and nav groups.
    <Group gap={variant === 'subtle' ? 2 : 'xs'}>
      {readOnly ? (
        <FileFlagBadge flag={flag ?? FileFlag.None} hideIfNone={true} />
      ) : (
        <FileFlagButtons
          flag={flag ?? FileFlag.None}
          onChange={handleFlagChange}
          variant={variant}
        />
      )}
      <Divider orientation="vertical" />
      <FileRating
        value={rating ?? 0}
        onChange={handleRatingChange}
        readOnly={readOnly}
      />
      <Divider orientation="vertical" />
      <CommentButton
        totalComments={totalComments ?? 0}
        onClick={() => openComment(file.id)}
        variant={variant}
      />
      <SetHeroImageButton file={file} variant={variant} />
    </Group>
  );
};
