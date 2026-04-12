import type { FolderFragmentFragment } from '@shared/gql/graphql';
import { ThemeMode } from '@shared/gql/graphql';
import { imageURL } from '../helpers/imageURL';
import { useMe } from '../hooks/useMe';
import { useMutation } from 'urql';
import { editFolderMutation } from '@shared/urql/mutations/editFolderMutation';
import { useOpenSetBannerImageModal } from '../atoms/modalAtom';
import {
  ActionIcon,
  alpha,
  Box,
  Breadcrumbs,
  Paper,
  Text,
  Title,
  Tooltip,
  useComputedColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { ChevronDownIcon, DeleteIcon, EditIcon } from '../PicrIcons';
import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { themeModeAtom } from '../atoms/themeModeAtom';
import { FolderLink } from './FolderLink';
import { Page } from './Page';
import {
  DEFAULT_HEADING_ALIGNMENT,
  type BannerSize,
  type BannerHAlign,
  type BannerVAlign,
} from '@shared/branding/galleryPresets';
import styles from './FolderBanner.module.css';
import { getBreadcrumbFolders } from '../helpers/getBreadcrumbFolders';

const bannerSizeClass: Record<BannerSize, string> = {
  classic: styles.sizeClassic,
  widescreen: styles.sizeWidescreen,
  cinematic: styles.sizeCinematic,
  full: styles.sizeFull,
};

type BannerFolder = Pick<
  FolderFragmentFragment,
  | 'id'
  | 'bannerImage'
  | 'bannerSize'
  | 'bannerTextHAlign'
  | 'bannerTextVAlign'
  | 'name'
  | 'title'
  | 'subtitle'
  | 'parents'
>;
const parallaxScale = 1.3;
const parallaxMaxShift = 150;
const isHTMLElement = (value: HTMLElement | Window): value is HTMLElement =>
  value instanceof HTMLElement;

const findScrollContainer = (element: HTMLElement): HTMLElement | Window => {
  let currentParent = element.parentElement;

  while (currentParent) {
    const overflowY = window.getComputedStyle(currentParent).overflowY;
    const canScroll = /(auto|scroll|overlay)/.test(overflowY);
    const hasScrollableContent =
      currentParent.scrollHeight > currentParent.clientHeight + 1;
    if (canScroll && hasScrollableContent) return currentParent;
    currentParent = currentParent.parentElement;
  }

  return window;
};

export const FolderBanner = ({ folder }: { folder: BannerFolder }) => {
  const me = useMe();
  const [, editFolder] = useMutation(editFolderMutation);
  const openSetBannerImageModal = useOpenSetBannerImageModal();
  const bannerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const hasBannerImage = Boolean(folder.bannerImage);
  const folderName = folder.name.trim() || '(Unnamed Folder)';
  const bannerTitle = folder.title?.trim() || folderName;
  const bannerSubtitle = folder.subtitle?.trim();
  const theme = useAtomValue(themeModeAtom);
  const mantineTheme = useMantineTheme();
  const computedColorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: true,
  });
  // Horizontal: folder-specific override → branding default → 'center'
  const hAlign: BannerHAlign =
    (folder.bannerTextHAlign as BannerHAlign | null) ??
    (theme.headingAlignment as BannerHAlign | null) ??
    DEFAULT_HEADING_ALIGNMENT;
  // Vertical: folder-specific override → 'center'
  const vAlign: BannerVAlign =
    (folder.bannerTextVAlign as BannerVAlign | null) ?? 'center';
  const resolvedMode =
    theme.mode == null || theme.mode === ThemeMode.Auto
      ? computedColorScheme === 'dark'
        ? ThemeMode.Dark
        : ThemeMode.Light
      : theme.mode;
  const isDark = resolvedMode === ThemeMode.Dark;
  const primaryScale = mantineTheme.colors[mantineTheme.primaryColor];
  const breadcrumbLinkColor = isDark ? primaryScale[4] : primaryScale[7];
  const breadcrumbColor = isDark
    ? mantineTheme.colors.gray[0]
    : mantineTheme.colors.dark[8];
  const breadcrumbBackground = isDark
    ? mantineTheme.colors.dark[5]
    : mantineTheme.white;
  const breadcrumbBorder = isDark
    ? `1px solid ${alpha(mantineTheme.white, 0.18)}`
    : `1px solid ${alpha(mantineTheme.black, 0.08)}`;
  const crumbs = getBreadcrumbFolders(folder.parents).map((parentFolder) => (
    <FolderLink
      folder={parentFolder}
      key={parentFolder.id}
      color={breadcrumbLinkColor}
    />
  ));

  useEffect(() => {
    if (!hasBannerImage) return;

    const bannerElement = bannerRef.current;
    const imageElement = imageRef.current;
    if (!bannerElement || !imageElement) return;

    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );
    let frameId: number | null = null;
    const scrollContainer = findScrollContainer(bannerElement);

    const updateParallax = () => {
      frameId = null;

      if (reducedMotionQuery.matches) {
        imageElement.style.transform = 'translate3d(0, 0, 0) scale(1)';
        return;
      }

      const rect = bannerElement.getBoundingClientRect();
      let viewportTop = 0;
      let viewportHeight = window.innerHeight;
      if (isHTMLElement(scrollContainer)) {
        const scrollContainerRect = scrollContainer.getBoundingClientRect();
        viewportTop = scrollContainerRect.top;
        viewportHeight = scrollContainerRect.height;
      }
      const topInViewport = rect.top - viewportTop;
      const bottomInViewport = rect.bottom - viewportTop;
      if (bottomInViewport < 0 || topInViewport > viewportHeight) return;

      const progress =
        (viewportHeight - topInViewport) / (viewportHeight + rect.height);
      const centeredProgress = (progress - 0.5) * 2;
      const clampedProgress = Math.max(-1, Math.min(1, centeredProgress));
      // Clamp shift to available buffer so it never exceeds the scaled image bounds
      // (important for short banners like cinematic on small phones)
      const availableBuffer = (rect.height * (parallaxScale - 1)) / 2;
      const effectiveMaxShift = Math.min(
        parallaxMaxShift,
        availableBuffer * 0.85,
      );
      const shift = clampedProgress * effectiveMaxShift;

      imageElement.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0) scale(${parallaxScale})`;
    };

    const requestParallaxUpdate = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(updateParallax);
    };

    requestParallaxUpdate();
    if (isHTMLElement(scrollContainer)) {
      scrollContainer.addEventListener('scroll', requestParallaxUpdate, {
        passive: true,
      });
    } else {
      window.addEventListener('scroll', requestParallaxUpdate, {
        passive: true,
      });
    }
    window.addEventListener('resize', requestParallaxUpdate);
    reducedMotionQuery.addEventListener('change', requestParallaxUpdate);

    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      if (isHTMLElement(scrollContainer)) {
        scrollContainer.removeEventListener('scroll', requestParallaxUpdate);
      } else {
        window.removeEventListener('scroll', requestParallaxUpdate);
      }
      window.removeEventListener('resize', requestParallaxUpdate);
      reducedMotionQuery.removeEventListener('change', requestParallaxUpdate);
    };
  }, [hasBannerImage]);

  const onClear = () => {
    void editFolder({ folderId: folder.id, bannerImageId: null });
  };

  const scrollPastBanner = () => {
    const bannerEl = bannerRef.current;
    if (!bannerEl) return;
    const scrollContainer = findScrollContainer(bannerEl);
    const rect = bannerEl.getBoundingClientRect();
    if (isHTMLElement(scrollContainer)) {
      const containerRect = scrollContainer.getBoundingClientRect();
      scrollContainer.scrollBy({
        top: rect.bottom - containerRect.top,
        behavior: 'smooth',
      });
    } else {
      window.scrollBy({ top: rect.bottom, behavior: 'smooth' });
    }
  };

  if (!folder.bannerImage) return null;

  const bannerImage = folder.bannerImage;

  const justifyClass =
    hAlign === 'left'
      ? styles.justifyLeft
      : hAlign === 'right'
        ? styles.justifyRight
        : styles.justifyCenter;
  const alignClass =
    hAlign === 'left'
      ? styles.alignLeft
      : hAlign === 'right'
        ? styles.alignRight
        : styles.alignCenter;
  const vAlignClass =
    vAlign === 'top'
      ? styles.vAlignTop
      : vAlign === 'bottom'
        ? styles.vAlignBottom
        : styles.vAlignCenter;

  const sizeClass = bannerSizeClass[folder.bannerSize as BannerSize];

  return (
    <Box className={styles.root}>
      <Box ref={bannerRef} className={`${styles.media} ${sizeClass}`}>
        <Box
          component="img"
          className={styles.image}
          ref={imageRef}
          src={imageURL(bannerImage, 'lg')}
          alt=""
          style={{
            transform: `translate3d(0, 0, 0) scale(${parallaxScale})`,
          }}
        />
        {/*<Overlay*/}
        {/*  gradient={`linear-gradient(180deg, ${alpha(mantineTheme.black, 0.45)} 0%, ${alpha(mantineTheme.black, 0.2)} 45%, ${alpha(mantineTheme.black, 0.45)} 100%)`}*/}
        {/*  style={{*/}
        {/*    pointerEvents: 'none',*/}
        {/*  }}*/}
        {/*/>*/}
        <Box className={`${styles.titleLayer} ${justifyClass} ${vAlignClass}`}>
          <Box className={`${styles.titleInner} ${alignClass}`}>
            <Title
              order={1}
              c="white"
              className={styles.title}
              style={{
                fontSize: theme.headingFontSize ?? undefined,
              }}
            >
              {bannerTitle}
            </Title>
            {bannerSubtitle ? (
              <Text
                c={alpha(mantineTheme.white, 0.95)}
                size="lg"
                className={styles.subtitle}
                style={{
                  fontSize: theme.headingFontSize
                    ? theme.headingFontSize * 0.6
                    : undefined,
                }}
              >
                {bannerSubtitle}
              </Text>
            ) : null}
          </Box>
        </Box>
      </Box>
      {crumbs.length ? (
        <Box className={styles.breadcrumbLayer}>
          <Page>
            <Paper
              className={styles.breadcrumbChip}
              display="inline-block"
              bg={breadcrumbBackground}
              c={breadcrumbColor}
              radius="xs"
              px="sm"
              py={2}
              style={{ border: breadcrumbBorder }}
              shadow="sm"
            >
              <Breadcrumbs
                separator="→"
                separatorMargin="md"
                styles={{ separator: { color: breadcrumbColor } }}
              >
                {crumbs}
              </Breadcrumbs>
            </Paper>
          </Page>
        </Box>
      ) : null}
      {me?.isUser ? (
        <>
          <Tooltip label="Edit banner">
            <ActionIcon
              className={styles.editButton}
              variant="filled"
              color="dark"
              onClick={() =>
                openSetBannerImageModal({
                  id: bannerImage.id,
                  type: bannerImage.type,
                  folderId: folder.id,
                  fileHash: bannerImage.fileHash,
                  isBannerImage: true,
                })
              }
            >
              <EditIcon />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Clear banner image">
            <ActionIcon
              className={styles.clearButton}
              variant="filled"
              color="dark"
              onClick={onClear}
            >
              <DeleteIcon />
            </ActionIcon>
          </Tooltip>
        </>
      ) : null}
      {folder.bannerSize === 'full' ? (
        <Tooltip label="Scroll to gallery">
          <ActionIcon
            className={styles.scrollButton}
            variant="filled"
            color="dark"
            onClick={scrollPastBanner}
            aria-label="Scroll to gallery"
          >
            <ChevronDownIcon />
          </ActionIcon>
        </Tooltip>
      ) : null}
    </Box>
  );
};
