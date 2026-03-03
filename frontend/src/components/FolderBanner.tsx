import type { FolderFragmentFragment } from '@shared/gql/graphql';
import { ThemeMode } from '@shared/gql/graphql';
import { imageURL } from '../helpers/imageURL';
import { useMe } from '../hooks/useMe';
import { useMutation } from 'urql';
import { editFolderMutation } from '@shared/urql/mutations/editFolderMutation';
import {
  ActionIcon,
  alpha,
  Box,
  Breadcrumbs,
  Overlay,
  Paper,
  Text,
  Title,
  Tooltip,
  useComputedColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { DeleteIcon } from '../PicrIcons';
import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { themeModeAtom } from '../atoms/themeModeAtom';
import { FolderLink } from './FolderLink';
import { Page } from './Page';
import type { PicrFolder } from '@shared/types/picr';
import styles from './FolderBanner.module.css';

type BannerFolder = Pick<
  FolderFragmentFragment,
  'id' | 'bannerImage' | 'name' | 'title' | 'subtitle' | 'parents'
>;
const parallaxScale = 1.2;
const parallaxMaxShift = 80;
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
  const bannerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const hasBannerImage = Boolean(folder.bannerImage);
  const folderName = folder.name?.trim() || '(Unnamed Folder)';
  const bannerTitle = folder.title?.trim() || folderName;
  const bannerSubtitle = folder.subtitle?.trim();
  const theme = useAtomValue(themeModeAtom);
  const mantineTheme = useMantineTheme();
  const computedColorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: true,
  });
  const alignment = theme.headingAlignment ?? 'center';
  const resolvedMode =
    theme.mode == null || theme.mode === ThemeMode.Auto
      ? computedColorScheme === 'dark'
        ? ThemeMode.Dark
        : ThemeMode.Light
      : theme.mode;
  const isDark = resolvedMode === ThemeMode.Dark;
  const primaryScale = mantineTheme.colors[mantineTheme.primaryColor];
  const breadcrumbLinkColor = isDark
    ? (primaryScale?.[4] ?? mantineTheme.colors.blue[4])
    : (primaryScale?.[7] ?? mantineTheme.colors.blue[7]);
  const breadcrumbColor = isDark
    ? mantineTheme.colors.gray[0]
    : mantineTheme.colors.dark[8];
  const breadcrumbBackground = isDark
    ? mantineTheme.colors.dark[5]
    : mantineTheme.white;
  const breadcrumbBorder = isDark
    ? `1px solid ${alpha(mantineTheme.white, 0.18)}`
    : `1px solid ${alpha(mantineTheme.black, 0.08)}`;
  const filledParents: PicrFolder[] | undefined = folder.parents?.map(
    (f, i) => {
      return { ...f, parents: folder.parents?.slice(i + 1) };
    },
  );
  const crumbs = filledParents?.length
    ? filledParents
        .slice(-3)
        .reverse()
        .map((p) => (
          <FolderLink folder={p} key={p.id} color={breadcrumbLinkColor} />
        ))
    : null;

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
      const shift = clampedProgress * parallaxMaxShift;

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
    editFolder({ folderId: folder.id, bannerImageId: null });
  };

  if (!folder.bannerImage) return null;

  const justifyClass =
    alignment === 'left'
      ? styles.justifyLeft
      : alignment === 'right'
        ? styles.justifyRight
        : styles.justifyCenter;
  const alignClass =
    alignment === 'left'
      ? styles.alignLeft
      : alignment === 'right'
        ? styles.alignRight
        : styles.alignCenter;

  return (
    <Box className={styles.root}>
      <Box ref={bannerRef} className={styles.media}>
        <Box
          component="img"
          className={styles.image}
          ref={imageRef}
          src={imageURL(folder.bannerImage, 'lg')}
          alt=""
          style={{
            transform: `translate3d(0, 0, 0) scale(${parallaxScale})`,
          }}
        />
        <Overlay
          gradient={`linear-gradient(180deg, ${alpha(mantineTheme.black, 0.45)} 0%, ${alpha(mantineTheme.black, 0.2)} 45%, ${alpha(mantineTheme.black, 0.45)} 100%)`}
          style={{
            pointerEvents: 'none',
          }}
        />
        <Box className={`${styles.titleLayer} ${justifyClass}`}>
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
      {crumbs ? (
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
      ) : null}
    </Box>
  );
};
