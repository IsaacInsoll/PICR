import { Drawer } from '@mantine/core';
import type { ReactNode } from 'react';

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
}: PicrDrawerProps) => (
  <Drawer
    opened={true}
    onClose={onClose}
    title={title}
    position="right"
    size={size}
    withOverlay={true}
    lockScroll={withOverlay}
    closeOnClickOutside={withOverlay}
    overlayProps={
      withOverlay
        ? { backgroundOpacity: 0.15, blur: 2 }
        : { backgroundOpacity: 0 }
    }
  >
    {children}
  </Drawer>
);
