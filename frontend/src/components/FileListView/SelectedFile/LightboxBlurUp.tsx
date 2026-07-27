import { useEffect, useState } from 'react';
import { Blurhash } from 'react-blurhash';
import { isImageSlide } from 'yet-another-react-lightbox';
import type { Slide } from 'yet-another-react-lightbox';

// Blur-up placeholder for lightbox image slides (issue #47/#1). The decoded
// blurhash covers the slide while the full image downloads, then fades out to
// reveal it — so opening a photo shows an instant colour impression instead of
// an empty backdrop. Rendered above the image (via render.slideContainer) with
// pointer-events disabled so it never blocks zoom/pan, and it fully fades to
// opacity 0 on load (it is a loading placeholder, not a persistent blurred
// background fill — that is the separate, deferred "gallery style" option).
export const LightboxBlurUp = ({ slide }: { slide: Slide }) => {
  if (!isImageSlide(slide) || !slide.blurHash || !slide.src) return null;
  return <BlurUp hash={slide.blurHash} src={slide.src} />;
};

const BlurUp = ({ hash, src }: { hash: string; src: string }) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const done = () => {
      if (!cancelled) setLoaded(true);
    };
    const img = new window.Image();
    img.src = src;
    // decode() resolves once the full image is ready to paint; fall back to
    // marking loaded on any error so the placeholder never gets stuck.
    img.decode().then(done, done);
    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: loaded ? 0 : 1,
        transition: 'opacity 400ms ease',
      }}
    >
      <Blurhash
        hash={hash}
        style={{ width: '100%', height: '100%' }}
        resolutionX={32}
        resolutionY={32}
        punch={1}
      />
    </div>
  );
};
