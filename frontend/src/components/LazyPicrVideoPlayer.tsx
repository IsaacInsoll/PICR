import { lazy, Suspense } from 'react';
import type { PicrVideoPlayerProps } from './PicrVideoPlayer';
import { useNoDownloadMediaProps } from '../hooks/useNoDownloadMediaProps';
import styles from './PicrVideoPlayer.module.css';

export const loadPicrVideoPlayer = () =>
  import('./PicrVideoPlayer').then((module) => ({
    default: module.PicrVideoPlayer,
  }));

const PicrVideoPlayer = lazy(loadPicrVideoPlayer);

export const LazyPicrVideoPlayer = (props: PicrVideoPlayerProps) => {
  return (
    <Suspense fallback={<VideoPosterFallback {...props} />}>
      <PicrVideoPlayer {...props} />
    </Suspense>
  );
};

const VideoPosterFallback = ({
  poster,
  title,
  className,
  style,
}: PicrVideoPlayerProps) => {
  const noDownloadMediaProps = useNoDownloadMediaProps();

  return (
    <div
      className={[styles.player, className].filter(Boolean).join(' ')}
      style={{
        ...style,
        background: 'var(--mantine-color-black)',
        overflow: 'hidden',
      }}
    >
      {poster ? (
        <img
          {...noDownloadMediaProps}
          src={poster}
          alt={title}
          style={{
            ...noDownloadMediaProps.style,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      ) : null}
    </div>
  );
};
