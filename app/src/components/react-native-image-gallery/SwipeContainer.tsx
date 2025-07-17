import React from 'react';
import PanContainer from './PanContainer';

const SwipeContainer = ({
  children,
  close,
  setIsDragging,
  disableSwipe,
}: {
  children: any;
  close: () => void;
  setIsDragging: any;
  disableSwipe?: boolean;
}) => {
  return disableSwipe ? (
    <>{children}</>
  ) : (
    <PanContainer setIsDragging={setIsDragging} close={close}>
      {children}
    </PanContainer>
  );
};

export default SwipeContainer;
