import { MinimalFile } from '../../../types';
import { Badge, MantineSize, MantineStyleProp } from '@mantine/core';
import { TbVideo } from 'react-icons/tb';
import formatDuration from 'format-duration';

interface VideoBadgeProps {
  file: MinimalFile;
  size?: MantineSize;
  percent?: number;
}

export const VideoBadge = ({ file, size, percent }: VideoBadgeProps) => {
  const duration =
    percent && file.duration
      ? (percent / 100.0) * file.duration
      : file.duration;
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
      leftSection={<TbVideo size="1.2rem" />}
      style={style}
      variant="light"
      color="gray"
      size={size}
    >
      {duration ? formatDuration(duration * 1000) : 'VIDEO'}
    </Badge>
  );
};
