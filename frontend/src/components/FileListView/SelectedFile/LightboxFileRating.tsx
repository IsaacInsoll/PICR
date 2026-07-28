import { useCommentPermissions } from '../../../hooks/useCommentPermissions';
import { Box } from '@mantine/core';
import { FileReview } from '../Review/FileReview';
import type { ReviewableFile } from '../Review/FileReview';
import { useLightboxState } from 'yet-another-react-lightbox';

// Review controls sit bottom-right, pairing with the toolbar's top-right stack.
// The slide counter lives bottom-left next to the navigation arrows (see
// LightboxCounter in SelectedFileView) rather than in here, so there is exactly
// one counter regardless of this viewer's comment permissions.
//
// Layout comes from the bottom rail (see lightboxRailsPlugin) — this used to be
// absolutely positioned over the image, which is what issues #47/#79 were about.
export const LightboxFileRating = ({ files }: { files: ReviewableFile[] }) => {
  const { isNone } = useCommentPermissions();
  const { currentIndex } = useLightboxState();
  const file = files.at(currentIndex);

  if (isNone || !file) return null;

  return (
    <Box className="picr-lightbox-footer" p="xs">
      {/* `subtle` drops the bordered boxes the feed view uses, so the controls
          sit on the rail like the rest of the chrome. Sizing is Mantine's
          default `md`, matching LightboxIconButton. */}
      <FileReview file={file} variant="subtle" />
    </Box>
  );
};
