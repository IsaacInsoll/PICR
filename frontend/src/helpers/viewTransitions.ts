import { flushSync } from 'react-dom';

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => void;
};

export const runViewTransition = (update: () => void) => {
  if (typeof document === 'undefined') {
    update();
    return;
  }
  const doc = document as ViewTransitionDocument;
  if (!doc.startViewTransition) {
    update();
    return;
  }
  doc.startViewTransition(() => {
    flushSync(update);
  });
};

export const viewTransitionNameForFile = (fileId: string) => {
  const safeId = fileId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `picr-file-${safeId}`;
};
