import { Modal, ModalProps } from '@mantine/core';
import { createRef, RefObject, useEffect } from 'react';

// Literally a normal Mantine Modal, but can appear over the top of the YARL Lightbox
export const PicrModal = ({ children, opened, ...props }: ModalProps) => {
  console.log('Modal Render');
  const ref = createRef<HTMLDivElement>();
  useEffect(() => {
    removeInertTag(ref);
    //sometimes there is a timing issue (IE: inital page load includes a YARL and a modal) so redo it again
    // setTimeout(() => removeInertTag(ref), 2000);
  }, [opened, props]);

  return (
    <Modal {...props} opened={opened} ref={ref}>
      {children}
    </Modal>
  );
};

const removeInertTag = (ref: RefObject<HTMLElement>) => {
  const inertParent = ref.current?.closest('div[inert=true]');
  if (inertParent) {
    console.log(['un-inerting', inertParent]);
    inertParent.removeAttribute('inert');
  } else {
    // console.log('nothing to un-inert', ref);
  }
};
