import { lazy, Suspense, useEffect } from 'react';
import { Modal } from '@mantine/core';
import { useQuery } from 'urql';
import { useTranslation } from 'react-i18next';
import { viewFileQuery } from '@shared/urql/queries/viewFileQuery';
import { useFolderPlaceholder } from '../hooks/useFolderPlaceholder';
import {
  useCloseFileModal,
  useFileModalState,
} from '../hooks/useFileModalNavigation';
import { LoadingIndicator } from './LoadingIndicator';
import QueryFeedback from './QueryFeedback';

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
const noSuspense = { suspense: false };

const FileModalLoading = ({
  onClose,
  title,
}: {
  onClose: () => void;
  title: string;
}) => (
  <Modal opened centered onClose={onClose} title={title}>
    <LoadingIndicator />
  </Modal>
);

export const FileModalHost = () => {
  const { t } = useTranslation('gallery');
  const modal = useFileModalState();
  const closeModal = useCloseFileModal();
  const [result, requery] = useQuery({
    query: viewFileQuery,
    variables: { fileId: modal?.fileId ?? '' },
    pause: !modal,
    requestPolicy: 'cache-first',
    context: noSuspense,
  });
  const queriedFile = result.data?.file;
  const file = queriedFile?.id === modal?.fileId ? queriedFile : undefined;
  const folder = useFolderPlaceholder(file?.folderId);
  const loadingModal = (
    <FileModalLoading onClose={closeModal} title={t('folder.loading')} />
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadCommentModal();
      void loadFileInfoModal();
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!modal) return null;
  if (!file) {
    if (!result.error) return loadingModal;

    return (
      <Modal opened centered onClose={closeModal} title={t('error.generic')}>
        <QueryFeedback
          result={result}
          reQuery={() => requery({ requestPolicy: 'network-only' })}
        />
      </Modal>
    );
  }

  return (
    <Suspense fallback={loadingModal}>
      {modal.mode === 'comments' ? (
        <CommentModal file={file} folder={folder} highlight={modal.highlight} />
      ) : (
        <FileInfoModal file={file} folder={folder} />
      )}
    </Suspense>
  );
};
