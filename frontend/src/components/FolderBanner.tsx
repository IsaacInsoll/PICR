import type { FolderFragmentFragment } from '@shared/gql/graphql';
import { imageURL } from '../helpers/imageURL';
import { useMe } from '../hooks/useMe';
import { useMutation } from 'urql';
import { editFolderMutation } from '@shared/urql/mutations/editFolderMutation';
import { ActionIcon, Text, Title, Tooltip } from '@mantine/core';
import { DeleteIcon } from '../PicrIcons';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { themeModeAtom } from '../atoms/themeModeAtom';

type BannerFolder = Pick<
  FolderFragmentFragment,
  'id' | 'bannerImage' | 'name' | 'title' | 'subtitle'
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
  const alignment = theme.headingAlignment ?? 'center';
  const alignItems =
    alignment === 'left'
      ? 'flex-start'
      : alignment === 'right'
        ? 'flex-end'
        : 'center';

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

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        ref={bannerRef}
        style={{
          width: '100%',
          minHeight: 150,
          maxHeight: 400,
          overflow: 'hidden',
        }}
      >
        <img
          ref={imageRef}
          src={imageURL(folder.bannerImage, 'lg')}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
            minHeight: 150,
            maxHeight: 400,
            transform: `translate3d(0, 0, 0) scale(${parallaxScale})`,
            willChange: 'transform',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.2) 45%, rgba(0, 0, 0, 0.45) 100%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: alignItems,
            padding: 16,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              textAlign: alignment as React.CSSProperties['textAlign'],
              maxWidth: '90%',
            }}
          >
            <Title
              order={1}
              c="white"
              style={{
                marginBottom: 4,
                textShadow: '0 3px 14px rgba(0, 0, 0, 0.75)',
                fontSize: theme.headingFontSize ?? undefined,
              }}
            >
              {bannerTitle}
            </Title>
            {bannerSubtitle ? (
              <Text
                c="rgba(255, 255, 255, 0.95)"
                size="lg"
                style={{
                  opacity: 0.8,
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.7)',
                  fontSize: theme.headingFontSize
                    ? theme.headingFontSize * 0.6
                    : undefined,
                }}
              >
                {bannerSubtitle}
              </Text>
            ) : null}
          </div>
        </div>
      </div>
      {me?.isUser ? (
        <Tooltip label="Clear banner image">
          <ActionIcon
            variant="filled"
            color="dark"
            style={{ position: 'absolute', top: 8, right: 8, opacity: 0.7 }}
            onClick={onClear}
          >
            <DeleteIcon />
          </ActionIcon>
        </Tooltip>
      ) : null}
    </div>
  );
};
