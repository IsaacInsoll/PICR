import { CommentModal } from './FileListView/Review/CommentModal';
import { FileInfoModal } from './FileListView/FileInfo/FileInfoModal';
import { modalTypeAtom } from '../atoms/modalAtom';
import { useAtomValue } from 'jotai';
import { MinimalFolder } from '../../types';

export const FolderModalManager = ({ folder }: { folder: MinimalFolder }) => {
  const a = useAtomValue(modalTypeAtom);
  if (!a) return;
  const [type, id, highlight] = a.split('-');

  const file = folder.files.find((f) => f.id == id);
  return (
    <>
      {type == 'comments' ? (
        <CommentModal file={file} highlight={highlight} />
      ) : null}
      {type == 'info' ? <FileInfoModal file={file} /> : null}
    </>
  );
};
