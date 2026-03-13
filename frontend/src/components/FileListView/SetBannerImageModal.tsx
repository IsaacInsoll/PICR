import {
  Box,
  Button,
  Divider,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { useState } from 'react';
import { useMutation } from 'urql';
import { useAtomValue } from 'jotai';
import { editFolderMutation } from '@shared/urql/mutations/editFolderMutation';
import {
  BANNER_SIZES,
  bannerSizeAspectRatios,
  bannerSizeLabels,
  bannerSizePortraitPercent,
  bannerSizeSubtitles,
  DEFAULT_BANNER_SIZE,
  type BannerSize,
} from '@shared/branding/galleryPresets';
import { imageURL } from '../../helpers/imageURL';
import {
  currentFolderBannerSizeAtom,
  type BannerImageCandidate,
} from '../../atoms/modalAtom';
import styles from './SetBannerImageModal.module.css';

// Skeleton rows simulate how much gallery is visible below the banner.
// Shorter banners (cinematic) reveal more rows; taller ones (classic) reveal fewer.
// +1 extra row per size so the last row always fades out.
const SKELETON_COUNTS: Record<BannerSize, number> = {
  classic: 2,
  widescreen: 2,
  cinematic: 3,
  full: 0,
};

const SizeCard = ({
  size,
  file,
  isActive,
  onSelect,
  onMouseEnter,
  onMouseLeave,
}: {
  size: BannerSize;
  file: BannerImageCandidate;
  isActive: boolean;
  onSelect: (size: BannerSize) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) => {
  const skeletons = SKELETON_COUNTS[size];
  return (
    <Box>
      <Box
        className={`${styles.card} ${styles.cardLandscape} ${isActive ? styles.cardActive : ''}`}
        onClick={() => onSelect(size)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <Box
          className={styles.preview}
          style={{ aspectRatio: bannerSizeAspectRatios[size] }}
        >
          <img
            src={imageURL(file, 'sm')}
            className={styles.previewImage}
            alt=""
          />
        </Box>
        {skeletons > 0 ? (
          <Box className={styles.skeletonArea}>
            {Array.from({ length: skeletons }, (_, i) => (
              <Box key={i} className={styles.skeletonRow}>
                {Array.from({ length: 4 }, (_, j) => (
                  <Box key={j} className={styles.skeletonThumb} />
                ))}
              </Box>
            ))}
          </Box>
        ) : null}
      </Box>
      <Box className={styles.cardLabel}>
        <Text size="sm" fw={600}>
          {bannerSizeLabels[size]}
        </Text>
        <Text size="xs" c="dimmed">
          {bannerSizeSubtitles[size]}
        </Text>
      </Box>
    </Box>
  );
};

const MobilePreview = ({
  file,
  size,
}: {
  file: BannerImageCandidate;
  size: BannerSize;
}) => {
  const skeletons = SKELETON_COUNTS[size];
  return (
    <Box className={styles.mobilePreview}>
      <Box className={styles.phoneFrame}>
        <Box
          className={styles.phoneBanner}
          style={{ height: `${bannerSizePortraitPercent[size]}%` }}
        >
          <img
            src={imageURL(file, 'sm')}
            className={styles.previewImage}
            alt=""
          />
        </Box>
        {skeletons > 0 ? (
          <Box className={styles.phoneGallery}>
            {Array.from({ length: skeletons }, (_, i) => (
              <Box key={i} className={styles.skeletonRow}>
                {Array.from({ length: 4 }, (_, j) => (
                  <Box key={j} className={styles.skeletonThumb} />
                ))}
              </Box>
            ))}
          </Box>
        ) : null}
      </Box>
      <Text size="xs" c="dimmed" ta="center" mt={6}>
        Mobile preview
      </Text>
    </Box>
  );
};

export const SetBannerImageModal = ({
  file,
  opened,
  onClose,
}: {
  file: BannerImageCandidate;
  opened: boolean;
  onClose: () => void;
}) => {
  const [, editFolder] = useMutation(editFolderMutation);
  const currentBannerSize = useAtomValue(currentFolderBannerSizeAtom);
  const [selectedSize, setSelectedSize] = useState<BannerSize | null>(
    BANNER_SIZES.includes(currentBannerSize as BannerSize)
      ? (currentBannerSize as BannerSize)
      : null,
  );
  const [hoveredSize, setHoveredSize] = useState<BannerSize | null>(null);

  const previewSize = hoveredSize ?? selectedSize ?? DEFAULT_BANNER_SIZE;

  const handleSave = () => {
    if (!selectedSize || !file.folderId) return;
    editFolder({
      folderId: file.folderId,
      bannerImageId: file.id,
      bannerSize: selectedSize,
    });
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Set Banner Image"
      size="560px"
      centered
    >
      <Stack gap="lg">
        {/* <Text size="sm" c="dimmed">Choose a banner size, then click Save.</Text> */}
        <Box className={styles.layout}>
          <SimpleGrid cols={2} spacing="md" style={{ width: 308 }}>
            {BANNER_SIZES.map((size) => (
              <SizeCard
                key={size}
                size={size}
                file={file}
                isActive={selectedSize === size}
                onSelect={setSelectedSize}
                onMouseEnter={() => setHoveredSize(size)}
                onMouseLeave={() => setHoveredSize(null)}
              />
            ))}
          </SimpleGrid>
          <Divider orientation="vertical" />
          <MobilePreview file={file} size={previewSize} />
        </Box>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedSize}>
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
