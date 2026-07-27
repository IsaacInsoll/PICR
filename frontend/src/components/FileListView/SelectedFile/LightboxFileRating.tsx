import { useCommentPermissions } from '../../../hooks/useCommentPermissions';
import { Group, Paper, Text } from '@mantine/core';
import { FileReview } from '../Review/FileReview';
import type { ReviewableFile } from '../Review/FileReview';
import { useLightboxState } from 'yet-another-react-lightbox';

export const LightboxFileRating = ({ files }: { files: ReviewableFile[] }) => {
  const { isNone } = useCommentPermissions();
  const { currentIndex } = useLightboxState();
  const file = files.at(currentIndex);

  if (isNone || !file) return null;

  // The slide counter lives inside this bar (right of the rating) so it can
  // never collide with the rating controls on a narrow screen. When this footer
  // is shown, YARL's standalone Counter plugin is dropped (see useLightboxToolbar).
  return (
    <Paper
      className="picr-lightbox-footer"
      style={{ position: 'absolute', bottom: 0, zIndex: 3 }}
      p="xs"
    >
      <Group gap="sm" wrap="nowrap">
        <FileReview file={file} />
        {files.length > 1 ? (
          <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
            {currentIndex + 1} / {files.length}
          </Text>
        ) : null}
      </Group>
    </Paper>
  );
};
