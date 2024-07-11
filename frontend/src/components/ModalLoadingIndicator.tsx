import { LoadingOverlay } from '@mantine/core';

export const ModalLoadingIndicator = () => {
  return (
    <LoadingOverlay
      visible={true}
      zIndex={1000}
      overlayProps={{ radius: 'sm', blur: 2 }}
    />
  );
};
