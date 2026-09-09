import { Drawer } from '@mantine/core';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface PicrDrawerProps {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  size?: string | number;
  withOverlay?: boolean;
}

export const PicrDrawer = ({
  title,
  onClose,
  children,
  size = 'md',
  withOverlay = true,
}: PicrDrawerProps) => {
  const { t } = useTranslation('admin');

  return (
    <Drawer
      opened={true}
      onClose={onClose}
      title={title}
      position="right"
      size={size}
      withOverlay={withOverlay}
      lockScroll={withOverlay}
      closeOnClickOutside={withOverlay}
      closeButtonProps={{ 'aria-label': t('common.close') }}
      overlayProps={
        withOverlay
          ? { backgroundOpacity: 0.15, blur: 2 }
          : { backgroundOpacity: 0 }
      }
    >
      {children}
    </Drawer>
  );
};
