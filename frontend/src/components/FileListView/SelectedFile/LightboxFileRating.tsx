import { useCommentPermissions } from '../../../hooks/useCommentPermissions';
import { Paper } from '@mantine/core';
import { FileReview } from '../Review/FileReview';
import type { ReviewableFile } from '../Review/FileReview';
import { useLightboxState } from 'yet-another-react-lightbox';

export const LightboxFileRating = ({ files }: { files: ReviewableFile[] }) => {
  const { isNone } = useCommentPermissions();
  const { currentIndex } = useLightboxState();
  const file = files.at(currentIndex);

  if (isNone || !file) return null;

  return (
    <Paper style={{ position: 'absolute', bottom: 0, zIndex: 3 }} p="xs">
      <FileReview file={file} />
    </Paper>
  );
};
