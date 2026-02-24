import { useCommentPermissions } from '../../../hooks/useCommentPermissions';
import { Paper } from '@mantine/core';
import { FileReview } from '../Review/FileReview';
import type { ReviewableFile } from '../Review/FileReview';

export const LightboxFileRating = ({
  selected,
}: {
  selected: ReviewableFile;
}) => {
  const { isNone } = useCommentPermissions();
  if (isNone) return null;
  return (
    <Paper style={{ position: 'absolute', bottom: 0 }} p="xs">
      <FileReview file={selected} />
    </Paper>
  );
};
