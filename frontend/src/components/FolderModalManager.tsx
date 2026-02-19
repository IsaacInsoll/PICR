import { CommentModal } from './FileListView/Review/CommentModal';
import { FileInfoModal } from './FileListView/FileInfo/FileInfoModal';
import { modalTypeAtom } from '../atoms/modalAtom';
import { useAtomValue } from 'jotai';
import { PicrFolder } from '../../types';

export const FolderModalManager = ({ folder }: { folder: PicrFolder }) => {
  const a = useAtomValue(modalTypeAtom);
  if (!a) return;
  const [type, id, highlight] = a.split('-');

  const file = folder.files?.find((f) => f.id == id);
  if (!file) return null;
  return (
    <>
      {type == 'comments' ? (
        <CommentModal file={file} highlight={highlight} />
      ) : null}
      {type == 'info' ? <FileInfoModal file={file} /> : null}
    </>
  );
};
