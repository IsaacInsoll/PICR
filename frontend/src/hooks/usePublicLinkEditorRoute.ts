import { useCallback } from 'react';
import { useLocation, useNavigate, type LinkProps } from 'react-router';
import { useLocationNavigation } from './useLocationNavigation';

export const publicLinkEditorSearchParam = 'link';
export const newPublicLinkId = 'new';

type PublicLinkEditorLocationState = {
  publicLinkEditor?: {
    selectedLinkId: string;
  };
};

export const publicLinkEditorLink = (
  folderPath: string,
  selectedLinkId: string,
): Pick<LinkProps, 'to' | 'state'> => ({
  to: `${folderPath}?${publicLinkEditorSearchParam}=${encodeURIComponent(selectedLinkId)}`,
  state: {
    publicLinkEditor: { selectedLinkId },
  } satisfies PublicLinkEditorLocationState,
});

export const usePublicLinkEditorRoute = ({
  returnToPreviousLocationOnClose = false,
}: {
  returnToPreviousLocationOnClose?: boolean;
} = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getCurrentLocation, navigateLocation } = useLocationNavigation();
  const searchParams = new URLSearchParams(location.search);
  const selectedLinkId = searchParams.get(publicLinkEditorSearchParam);

  const setSelectedLinkId = useCallback(
    (id: string | null) => {
      navigateLocation((current) => {
        const next = new URLSearchParams(current.search);
        if (id) next.set(publicLinkEditorSearchParam, id);
        else next.delete(publicLinkEditorSearchParam);
        const encoded = next.toString();
        return {
          search: encoded ? `?${encoded}` : '',
          replace: true,
          state: current.state,
        };
      });
    },
    [navigateLocation],
  );

  const closeEditor = useCallback(() => {
    const state = getCurrentLocation()
      .state as PublicLinkEditorLocationState | null;
    if (
      returnToPreviousLocationOnClose &&
      selectedLinkId &&
      state?.publicLinkEditor?.selectedLinkId === selectedLinkId
    ) {
      void navigate(-1);
      return;
    }

    setSelectedLinkId(null);
  }, [
    getCurrentLocation,
    navigate,
    returnToPreviousLocationOnClose,
    selectedLinkId,
    setSelectedLinkId,
  ]);

  return { selectedLinkId, setSelectedLinkId, closeEditor };
};
