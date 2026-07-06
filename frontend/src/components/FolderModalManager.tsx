import { lazy, Suspense, useEffect } from 'react';
import { modalTypeAtom } from '../atoms/modalAtom';
import { useAtomValue } from 'jotai';
import type { PicrFolder } from '@shared/types/picr';

const loadCommentModal = () =>
  import('./FileListView/Review/CommentModal').then((module) => ({
    default: module.CommentModal,
  }));
const loadFileInfoModal = () =>
  import('./FileListView/FileInfo/FileInfoModal').then((module) => ({
    default: module.FileInfoModal,
  }));

const CommentModal = lazy(loadCommentModal);
const FileInfoModal = lazy(loadFileInfoModal);

export const FolderModalManager = ({ folder }: { folder: PicrFolder }) => {
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadCommentModal();
      void loadFileInfoModal();
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, []);

  const a = useAtomValue(modalTypeAtom);
  if (!a) return;
  const [type, id, highlight] = a.split('-');

  const file = folder.files?.find((f) => f.id === id);
  if (!file) return null;
  return (
    <Suspense fallback={null}>
      {type === 'comments' ? (
        <CommentModal file={file} highlight={highlight} />
      ) : null}
      {type === 'info' ? <FileInfoModal file={file} /> : null}
    </Suspense>
  );
};
