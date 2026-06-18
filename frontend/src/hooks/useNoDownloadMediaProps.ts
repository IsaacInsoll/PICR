import type { CSSProperties, SyntheticEvent } from 'react';
import { useCallback, useMemo } from 'react';
import { useCanDownload } from './useMe';

type NoDownloadStyle = CSSProperties & {
  WebkitTouchCallout?: CSSProperties['userSelect'];
};

const noDownloadStyle: NoDownloadStyle = {
  userSelect: 'none',
  WebkitTouchCallout: 'none',
};

export const useNoDownloadMediaProps = () => {
  const canDownload = useCanDownload();

  const onContextMenu = useCallback(
    (event: SyntheticEvent) => {
      if (!canDownload) event.preventDefault();
    },
    [canDownload],
  );

  return useMemo(
    () =>
      canDownload
        ? {}
        : {
            draggable: false,
            onContextMenu,
            style: noDownloadStyle,
          },
    [canDownload, onContextMenu],
  );
};
