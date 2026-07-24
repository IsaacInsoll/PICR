import type { PicrFile } from '@shared/types/picr';
import type { MantineSize, MantineStyleProp } from '@mantine/core';
import { Badge, Box } from '@mantine/core';
import { PlayIcon, VideoIcon } from '../../PicrIcons';
import formatDuration from 'format-duration';

interface VideoBadgeProps {
  file: PicrFile;
  size?: MantineSize;
  percent?: number;
  density?: 'rich' | 'compact';
}

export const VideoBadge = ({
  file,
  size,
  percent,
  density = 'rich',
}: VideoBadgeProps) => {
  const duration =
    percent && file.duration
      ? (percent / 100.0) * file.duration
      : file.duration;

  if (density === 'compact') {
    const label = duration
      ? `Video, ${formatDuration(duration * 1000)}`
      : 'Video';

    return (
      <Box
        aria-label={label}
        title={label}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 20,
          height: 20,
          borderRadius: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--mantine-color-white)',
          background: 'rgba(0, 0, 0, 0.58)',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.22)',
          pointerEvents: 'none',
          zIndex: 50,
        }}
      >
        <PlayIcon size="0.7rem" style={{ marginLeft: 1 }} />
      </Box>
    );
  }

  const style: MantineStyleProp = {
    position: 'absolute',
    bottom: 12,
    right: 8,
    cursor: 'pointer',
    opacity: 0.66,
    zIndex: 50,
  };

  return (
    <Badge
      leftSection={<VideoIcon size="1.2rem" />}
      style={style}
      variant="light"
      color="gray"
      size={size}
    >
      {duration ? formatDuration(duration * 1000) : 'VIDEO'}
    </Badge>
  );
};
