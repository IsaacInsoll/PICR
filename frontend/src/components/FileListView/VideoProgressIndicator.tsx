import { Progress } from '@mantine/core';

export const VideoProgressIndicator = ({ frame }: { frame: number }) => {
  return (
    <Progress
      color="blue"
      radius="xl"
      size="xs"
      value={frame * 10}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
      }}
    />
  );
};
