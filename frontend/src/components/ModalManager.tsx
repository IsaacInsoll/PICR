import { CommentModal } from './FileListView/Review/CommentModal';
import { FileInfoModal } from './FileListView/FileInfo/FileInfoModal';
import { modalAtom } from '../atoms/modalAtom';
import { useAtomValue } from 'jotai';

export const ModalManager = () => {
  const { mode } = useAtomValue(modalAtom);
  return (
    <>
      {mode == 'comments' ? <CommentModal /> : null}
      {mode == 'info' ? <FileInfoModal /> : null}
    </>
  );
};
