import { useQuery } from 'urql';
import { commentHistoryQuery } from '@shared/urql/queries/commentHistoryQuery';
import { useCommentPermissions } from '../hooks/useCommentPermissions';
import { Stack } from '@mantine/core';
import { CommentHistory } from '../components/FileListView/Review/CommentHistory';

export const FolderActivity = ({ folderId }: { folderId: number }) => {
  const [result, requery] = useQuery({
    query: commentHistoryQuery,
    variables: { folderId },
    requestPolicy: 'cache-and-network',
  });
  // const [, mutate] = useMutation(addCommentMutation);
  // const [text, setText] = useState('');
  // const [submitting, setSubmitting] = useState(false);
  const { commentPermissions, readOnly, canEdit } = useCommentPermissions();

  // const onSubmit = async () => {
  //   setSubmitting(true);
  //   const result = await mutate({ id: file?.id, comment: text });
  //   await requery();
  //   setSubmitting(false);
  //   if (!result.error) setText('');
  // };

  const comments = result.data.comments;

  return (
    <Stack pt="md">
      <CommentHistory comments={comments} />
    </Stack>
  );
};
