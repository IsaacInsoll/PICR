import { Modal, ModalProps } from '@mantine/core';
import { createRef, useEffect } from 'react';

// Literally a normal Mantine Modal, but can appear over the top of the YARL Lightbox
export const PicrModal = ({ children, opened, ...props }: ModalProps) => {
  const ref = createRef<HTMLDivElement>();
  useEffect(() => {
    const inertParent = ref.current?.closest('div[inert=true]');
    if (inertParent) {
      console.log(['un-inerting', inertParent]);
      inertParent.removeAttribute('inert');
    }
  }, [opened]);

  return (
    <Modal {...props} opened={opened} ref={ref}>
      {children}
    </Modal>
  );
};
