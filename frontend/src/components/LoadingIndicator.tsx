import { Loader } from '@mantine/core';

export const LoadingIndicator = ({ size }: { size?: 'large' | undefined }) => {
  return <Loader color="blue" size={size == 'large' ? 32 : undefined} />;
};
