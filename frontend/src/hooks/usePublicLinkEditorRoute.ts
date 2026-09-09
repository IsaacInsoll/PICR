import { useCallback } from 'react';
import {
  useLocation,
  useNavigate,
  useSearchParams,
  type LinkProps,
} from 'react-router';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedLinkId = searchParams.get(publicLinkEditorSearchParam);

  const setSelectedLinkId = useCallback(
    (id: string | null) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (id) next.set(publicLinkEditorSearchParam, id);
          else next.delete(publicLinkEditorSearchParam);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const closeEditor = useCallback(() => {
    const state = location.state as PublicLinkEditorLocationState | null;
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
    location.state,
    navigate,
    returnToPreviousLocationOnClose,
    selectedLinkId,
    setSelectedLinkId,
  ]);

  return { selectedLinkId, setSelectedLinkId, closeEditor };
};
