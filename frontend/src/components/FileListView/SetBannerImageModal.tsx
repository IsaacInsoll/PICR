import {
  Box,
  Button,
  Divider,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
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
  DEFAULT_HEADING_ALIGNMENT,
  type BannerSize,
  type BannerHAlign,
  type BannerVAlign,
} from '@shared/branding/galleryPresets';
import { imageURL } from '../../helpers/imageURL';
import {
  currentFolderBannerSizeAtom,
  currentFolderBannerHAlignAtom,
  currentFolderBannerVAlignAtom,
  type BannerImageCandidate,
} from '../../atoms/modalAtom';
import { themeModeAtom } from '../../atoms/themeModeAtom';
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

type Position = { h: BannerHAlign; v: BannerVAlign };

const GRID_POSITIONS: Position[] = [
  { v: 'top', h: 'left' },
  { v: 'top', h: 'center' },
  { v: 'top', h: 'right' },
  { v: 'center', h: 'left' },
  { v: 'center', h: 'center' },
  { v: 'center', h: 'right' },
  { v: 'bottom', h: 'left' },
  { v: 'bottom', h: 'center' },
  { v: 'bottom', h: 'right' },
];

const positionLabel = (p: Position) =>
  `${p.v === 'center' ? 'Middle' : p.v.charAt(0).toUpperCase() + p.v.slice(1)} ${p.h.charAt(0).toUpperCase() + p.h.slice(1)}`;

const hAlignToJustify: Record<BannerHAlign, string> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
};

const vAlignToItems: Record<BannerVAlign, string> = {
  top: 'flex-start',
  center: 'center',
  bottom: 'flex-end',
};

const hAlignToText: Record<BannerHAlign, string> = {
  left: 'left',
  center: 'center',
  right: 'right',
};

const TextOverlay = ({
  title,
  position,
}: {
  title: string;
  position: Position;
}) => (
  <Box
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: vAlignToItems[position.v],
      justifyContent: hAlignToJustify[position.h],
      padding: '6px 8px',
      pointerEvents: 'none',
    }}
  >
    <Text
      size="xs"
      fw={700}
      style={{
        color: 'white',
        textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        textAlign: hAlignToText[position.h] as React.CSSProperties['textAlign'],
        lineHeight: 1.2,
        maxWidth: '90%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {title}
    </Text>
  </Box>
);

const PositionGrid = ({
  value,
  onChange,
}: {
  value: Position;
  onChange: (p: Position) => void;
}) => (
  <Box>
    <Text size="xs" c="dimmed" mb={6}>
      Text position
    </Text>
    <SimpleGrid cols={3} spacing={4} style={{ width: 84 }}>
      {GRID_POSITIONS.map((pos) => {
        const isActive = pos.h === value.h && pos.v === value.v;
        return (
          <Tooltip
            key={`${pos.v}-${pos.h}`}
            label={positionLabel(pos)}
            withArrow
            fz="xs"
          >
            <UnstyledButton
              className={`${styles.positionCell} ${isActive ? styles.positionCellActive : ''}`}
              onClick={() => onChange(pos)}
              aria-label={positionLabel(pos)}
              aria-pressed={isActive}
            />
          </Tooltip>
        );
      })}
    </SimpleGrid>
  </Box>
);

const SizeCard = ({
  size,
  file,
  isActive,
  onSelect,
  onMouseEnter,
  onMouseLeave,
  position,
  previewTitle,
}: {
  size: BannerSize;
  file: BannerImageCandidate;
  isActive: boolean;
  onSelect: (size: BannerSize) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  position: Position;
  previewTitle: string;
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
          <TextOverlay title={previewTitle} position={position} />
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
  position,
  previewTitle,
}: {
  file: BannerImageCandidate;
  size: BannerSize;
  position: Position;
  previewTitle: string;
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
          <TextOverlay title={previewTitle} position={position} />
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
  previewTitle,
}: {
  file: BannerImageCandidate;
  opened: boolean;
  onClose: () => void;
  previewTitle: string;
}) => {
  const [, editFolder] = useMutation(editFolderMutation);
  const currentBannerSize = useAtomValue(currentFolderBannerSizeAtom);
  const currentBannerHAlign = useAtomValue(currentFolderBannerHAlignAtom);
  const currentBannerVAlign = useAtomValue(currentFolderBannerVAlignAtom);
  const theme = useAtomValue(themeModeAtom);

  const [selectedSize, setSelectedSize] = useState<BannerSize | null>(
    BANNER_SIZES.includes(currentBannerSize as BannerSize)
      ? (currentBannerSize as BannerSize)
      : null,
  );
  const [hoveredSize, setHoveredSize] = useState<BannerSize | null>(null);

  const brandingHAlign = (theme.headingAlignment ??
    DEFAULT_HEADING_ALIGNMENT) as BannerHAlign;

  // Track the explicit folder-level overrides separately from the display value.
  // null means "inherit from branding" — we only write a value if the user
  // explicitly picks one (or the folder already had one).
  const [hAlign, setHAlign] = useState<BannerHAlign | null>(
    currentBannerHAlign as BannerHAlign | null,
  );
  const [vAlign, setVAlign] = useState<BannerVAlign | null>(
    currentBannerVAlign as BannerVAlign | null,
  );

  // Derive the display position: fall back to branding/default for the preview
  // and grid highlight without turning the fallback into a saved override.
  const position: Position = {
    h: hAlign ?? brandingHAlign,
    v: vAlign ?? 'center',
  };

  const handlePositionChange = (p: Position) => {
    setHAlign(p.h);
    setVAlign(p.v);
  };

  const previewSize = hoveredSize ?? selectedSize ?? DEFAULT_BANNER_SIZE;

  const handleSave = () => {
    if (!selectedSize || !file.folderId) return;
    void editFolder({
      folderId: file.folderId,
      bannerImageId: file.id,
      bannerSize: selectedSize,
      bannerTextHAlign: hAlign,
      bannerTextVAlign: vAlign,
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
                position={position}
                previewTitle={previewTitle}
              />
            ))}
          </SimpleGrid>
          <Divider orientation="vertical" />
          <Stack gap="md" align="center" justify="center">
            <MobilePreview
              file={file}
              size={previewSize}
              position={position}
              previewTitle={previewTitle}
            />
            <PositionGrid value={position} onChange={handlePositionChange} />
          </Stack>
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
