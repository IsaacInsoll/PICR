import { readHashParam, withHashParam } from './hashParams';

export type FileModalMode = 'info' | 'comments';

export interface FileModalState {
  mode: FileModalMode;
  fileId: string;
  highlight?: string;
}

export interface FileModalNavigationLocation {
  hash: string;
  state: unknown;
}

export const serializeFileModalState = ({
  mode,
  fileId,
  highlight,
}: FileModalState) => `${mode}-${fileId}${highlight ? `-${highlight}` : ''}`;

export const parseFileModalState = (
  value: string,
): FileModalState | undefined => {
  const [mode, fileId, ...highlightParts] = value.split('-');
  if ((mode !== 'info' && mode !== 'comments') || !fileId) return undefined;

  const highlight = highlightParts.join('-');
  return {
    mode,
    fileId,
    highlight: highlight || undefined,
  };
};

export const parseFileModalHash = (hash: string) => {
  const value = readHashParam(hash, 'm');
  return value ? parseFileModalState(value) : undefined;
};

export const withFileModalState = (hash: string, state?: FileModalState) => {
  return withHashParam(
    hash,
    'm',
    state ? serializeFileModalState(state) : undefined,
  );
};

export const fileModalHistoryState = (state: unknown) => ({
  ...(typeof state === 'object' && state !== null && !Array.isArray(state)
    ? state
    : {}),
  fileModalOpened: true,
  fileModalOpenedAt: Date.now(),
});

export const wasFileModalOpenedInCurrentDocument = (state: unknown) => {
  if (
    typeof state !== 'object' ||
    state === null ||
    !('fileModalOpened' in state) ||
    state.fileModalOpened !== true
  ) {
    return false;
  }

  const openedAt =
    'fileModalOpenedAt' in state ? state.fileModalOpenedAt : undefined;
  return (
    typeof openedAt === 'number' &&
    typeof performance !== 'undefined' &&
    openedAt >= performance.timeOrigin
  );
};

export const buildFileModalNavigation = (
  location: FileModalNavigationLocation,
  modal: FileModalState,
) => {
  const modalOpen = Boolean(parseFileModalHash(location.hash));
  return {
    hash: withFileModalState(location.hash, modal),
    replace: modalOpen,
    state: modalOpen ? location.state : fileModalHistoryState(location.state),
  };
};
