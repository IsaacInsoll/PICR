import type { Slide } from 'yet-another-react-lightbox';
import { isImageSlide, useLightboxState } from 'yet-another-react-lightbox';
import { isPicrVideoSlide } from './filesForLightbox';
import { LightboxIconButton } from './LightboxIconButton';
import { DownloadIcon } from '../../../PicrIcons';
import {
  anchorDownload,
  canUseShareSheet,
  shareOrDownload,
} from '../../../helpers/shareOrDownload';
import { useTranslation } from 'react-i18next';

const slideDownload = (slide?: Slide) => {
  if (!slide) return undefined;
  const { download } = slide;
  const url =
    typeof download === 'object'
      ? download.url
      : typeof download === 'string'
        ? download
        : slide.downloadUrl;
  if (!url) return undefined;
  const filename =
    typeof download === 'object' ? download.filename : slide.downloadFilename;
  // Only media (Image/Video) goes through the iOS share sheet; documents keep the
  // regular anchor download ("Save to Files"), matching isShareableMediaFile
  // elsewhere. A non-media File slide is an empty object (see filesForLightbox),
  // so it has neither an image src nor video `sources`.
  const isMedia = isImageSlide(slide) || isPicrVideoSlide(slide);
  return { url, filename, isMedia };
};

// PICR renders its own download button rather than using YARL's Download plugin,
// whose only job is to add one. Doing it here means the button is a
// LightboxIconButton like every other control — YARL's IconButton carries a
// plain native `title` tooltip, which looked out of place next to the Mantine
// ones — and the iOS share-sheet routing sits next to the URL resolution it
// depends on.
export const LightboxDownloadButton = () => {
  const { t } = useTranslation('gallery');
  const { currentSlide } = useLightboxState();
  const target = slideDownload(currentSlide);

  return (
    <LightboxIconButton
      icon={<DownloadIcon size="16" />}
      label={t('download.button')}
      disabled={!target}
      onClick={() => {
        if (!target) return;
        // On iOS, route media through the native share sheet ("Save to Photos")
        // instead of the anchor `download` attribute (which opens "Save to Files").
        if (target.isMedia && canUseShareSheet()) {
          void shareOrDownload(target.url, target.filename ?? '', t);
        } else {
          anchorDownload(target.url, target.filename);
        }
      }}
    />
  );
};
