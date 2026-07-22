import '@vidstack/react/player/styles/base.css';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

import {
  MediaPlayer,
  MediaProvider,
  PlayButton,
  Poster,
  type MediaTimeUpdateEventDetail,
  useMediaRemote,
  useMediaState,
} from '@vidstack/react';
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from '@vidstack/react/player/layouts/default';
import { useEffect, type CSSProperties } from 'react';
import styles from './PicrVideoPlayer.module.css';
import { useNoDownloadMediaProps } from '../hooks/useNoDownloadMediaProps';
import { PlayIcon } from '../PicrIcons';

type PicrVideoPlayerStyle = CSSProperties & {
  [name: `--${string}`]: string | number | null | undefined;
};

export interface PicrVideoPlayerProps {
  src: string;
  title: string;
  poster?: string;
  canDownload: boolean;
  duration?: number;
  active?: boolean;
  autoPlay?: boolean;
  className?: string;
  style?: PicrVideoPlayerStyle;
  onPlay?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
}

export const PicrVideoPlayer = ({
  src,
  title,
  poster,
  canDownload,
  duration,
  active = true,
  autoPlay = false,
  className,
  style,
  onPlay,
  onTimeUpdate,
  onDurationChange,
}: PicrVideoPlayerProps) => {
  const noDownloadMediaProps = useNoDownloadMediaProps();
  const downloadUrl = canDownload
    ? new URL(src, window.location.href).href
    : undefined;

  return (
    <MediaPlayer
      {...noDownloadMediaProps}
      className={[styles.player, className].filter(Boolean).join(' ')}
      style={{
        ...noDownloadMediaProps.style,
        ...style,
      }}
      src={src}
      title={title}
      poster={poster}
      duration={duration}
      autoPlay={active && autoPlay}
      // playback is also driven imperatively by ActivePlaybackController below so
      // that navigating between slides restarts video, not just the first load
      playsInline
      onPlay={() => onPlay?.()}
      onTimeUpdate={(detail: MediaTimeUpdateEventDetail) => {
        onTimeUpdate?.(detail.currentTime);
      }}
      onDurationChange={(duration: number) => {
        onDurationChange?.(duration);
      }}
    >
      <MediaProvider>
        {poster ? <Poster src={poster} alt="" /> : null}
      </MediaProvider>
      <ActivePlaybackController active={active} autoPlay={autoPlay} />
      <PausedPlayOverlay />
      <DefaultVideoLayout
        colorScheme="dark"
        download={downloadUrl ? { url: downloadUrl, filename: title } : null}
        icons={defaultLayoutIcons}
        slots={canDownload ? undefined : { downloadButton: null }}
      />
    </MediaPlayer>
  );
};

// Keeps playback in sync with the active YARL slide. YARL keeps neighbouring
// slides mounted within its preload window, so inactive players must pause, and
// a slide the user navigates to must (re)start when autoplay is requested — the
// `autoPlay` attribute only fires on initial load, not when the prop flips on an
// already-mounted player. Gating play on `canPlay` waits for the media (loaded
// lazily once the slide is visible) to be ready to start.
const ActivePlaybackController = ({
  active,
  autoPlay,
}: {
  active: boolean;
  autoPlay: boolean;
}) => {
  const remote = useMediaRemote();
  const canPlay = useMediaState('canPlay');

  useEffect(() => {
    if (!active) {
      remote.pause();
    } else if (autoPlay && canPlay) {
      remote.play();
    }
  }, [active, autoPlay, canPlay, remote]);

  return null;
};

const PausedPlayOverlay = () => {
  const paused = useMediaState('paused');

  if (!paused) return null;

  return (
    <div className={styles.playOverlay}>
      <PlayButton className={styles.playOverlayButton} aria-label="Play video">
        <PlayIcon className={styles.playOverlayIcon} />
      </PlayButton>
    </div>
  );
};
