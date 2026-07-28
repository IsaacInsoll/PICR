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
import { useEffect, type CSSProperties, type ReactNode } from 'react';
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
  duration?: number;
  active?: boolean;
  autoPlay?: boolean;
  className?: string;
  style?: PicrVideoPlayerStyle;
  onPlay?: () => void;
  /**
   * Rendered in the bottom control bar, beside the settings cog. Requires
   * `hideFullscreenButton`, since it occupies the slot the fullscreen button
   * would have used.
   *
   * The lightbox uses this to offer a way out of Focus state: tapping a video
   * means play/pause, so the tap-to-toggle gesture is disabled on video slides,
   * and the lightbox toolbar is hidden while in Focus — without this a video
   * left in Focus is a dead end for pointer users.
   */
  controlBarEnd?: ReactNode;
  /**
   * Hides the player's own fullscreen button, freeing its slot for
   * `controlBarEnd`. The lightbox offers fullscreen in its own toolbar, so
   * inside it the player's is a duplicate; the inline feed has no such chrome
   * and keeps it.
   */
  hideFullscreenButton?: boolean;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
}

export const PicrVideoPlayer = ({
  src,
  title,
  poster,
  duration,
  active = true,
  autoPlay = false,
  className,
  style,
  onPlay,
  controlBarEnd,
  hideFullscreenButton = false,
  onTimeUpdate,
  onDurationChange,
}: PicrVideoPlayerProps) => {
  const noDownloadMediaProps = useNoDownloadMediaProps();
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
        icons={defaultLayoutIcons}
        slots={{
          // `undefined` keeps Vidstack's default for a slot; `null` removes it.
          // Downloads are handled outside the player everywhere (the lightbox
          // toolbar, the feed's own controls), so the player never offers one.
          downloadButton: null,
          // Vidstack's bottom bar has no free "end" slot — it is a fixed set of
          // named buttons. The lightbox hides the fullscreen button anyway
          // (it has its own), so that position is available for `controlBarEnd`,
          // which puts it beside the settings cog in both the large and small
          // layouts. Falls back to null so the button stays removed when nothing
          // is supplied.
          fullscreenButton: hideFullscreenButton
            ? (controlBarEnd ?? null)
            : undefined,
        }}
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
