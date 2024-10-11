import { MinimalFile } from '../../../../types';
import { useCommentPermissions } from '../../../hooks/useCommentPermissions';
import { Paper } from '@mantine/core';
import { FileReview } from '../Review/FileReview';

export const LightboxFileRating = ({ selected }: { selected: MinimalFile }) => {
  const { isNone } = useCommentPermissions();
  if (isNone) return null;
  return (
    <Paper style={{ position: 'absolute', bottom: 0 }} p="xs">
      <FileReview file={selected} />
    </Paper>
  );
};