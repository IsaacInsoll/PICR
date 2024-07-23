import { MinimalFile } from '../../../types';
import { Badge, MantineSize, MantineStyleProp } from '@mantine/core';
import { TbVideo } from 'react-icons/tb';
import formatDuration from 'format-duration';

export const VideoBadge = ({
  file,
  size,
}: {
  file: MinimalFile;
  size?: MantineSize;
}) => {
  const duration = file.duration
    ? formatDuration(file.duration * 1000)
    : 'VIDEO';
  const style: MantineStyleProp = {
    position: 'absolute',
    bottom: 12,
    right: 8,
    cursor: 'pointer',
    opacity: 0.66,
  };

  return (
    <Badge
      leftSection={<TbVideo size="1.2rem" />}
      style={style}
      variant="light"
      color="gray"
      size={size}
    >
      {duration}
    </Badge>
  );
};
