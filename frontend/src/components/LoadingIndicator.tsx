import { Loader } from '@mantine/core';

export const LoadingIndicator = ({
  size,
}: {
  size?: 'large' | 'small' | undefined;
}) => {
  return (
    <Loader size={size == 'large' ? 32 : size == 'small' ? 16 : undefined} />
  );
};
