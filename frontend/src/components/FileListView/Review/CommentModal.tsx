import { Button, Divider, Group, Modal, Stack, Textarea } from '@mantine/core';
import { closeModalAtom } from '../../../atoms/modalAtom';
import { useSetAtom } from 'jotai/index';
import { LoadingIndicator } from '../../LoadingIndicator';
import { Suspense, useState } from 'react';
import { useMutation, useQuery } from 'urql';
import { PicrFile } from '../../../../types';
import { useCommentPermissions } from '../../../hooks/useCommentPermissions';
import { addCommentMutation } from '@shared/urql/mutations/addCommentMutation';
import { useIsSmallScreen } from '../../../hooks/useIsMobile';
import { commentHistoryQuery } from '@shared/urql/queries/commentHistoryQuery';
import { CommentHistory } from './CommentHistory';
import { FilePreview } from '../FilePreview';
import { MutationAddCommentArgs } from '../../../../../graphql-types';

export const CommentModal = ({
  file,
  highlight,
}: {
  file: PicrFile;
  highlight?: string;
}) => {
  const onClose = useSetAtom(closeModalAtom);
  const isMobile = useIsSmallScreen();

  return (
    <>
      <Modal
        opened={true}
        onClose={onClose}
        title={'Comments on ' + file?.name}
        fullScreen={isMobile}
      >
        <Suspense fallback={<LoadingIndicator />}>
          <CommentBody file={file} highlight={highlight} />
        </Suspense>
      </Modal>
    </>
  );
};

const CommentBody = ({
  file,
  highlight,
}: {
  file: PicrFile;
  highlight?: string;
}) => {
  const [result, requery] = useQuery({
    query: commentHistoryQuery,
    variables: { fileId: file.id },
    requestPolicy: 'cache-and-network',
  });

  const comments = result.data?.comments ?? [];

  return (
    <Stack>
      {/* previously this was `highlight ? <FilePreview file={file} /> : null` so you don't see preview if you came from gallery*/}
      <FilePreview file={file} />
      <CommentHistory
        comments={comments}
        singleFile={true}
        highlight={highlight}
      />
      <AddCommentBox fileId={file.id} onComplete={() => requery()} />
    </Stack>
  );
};

const AddCommentBox = ({
  fileId,
  folderId,
  onComplete,
}: {
  fileId?: string;
  folderId?: string;
  onComplete: () => void;
}) => {
  const [, mutate] = useMutation(addCommentMutation);
  const [submitting, setSubmitting] = useState(false);
  const { canEdit } = useCommentPermissions();
  const [text, setText] = useState('');

  if (!canEdit) return null;
  if (!fileId && !folderId)
    throw new Error('AddCommentBox requires either a fileId or folderId!');

  const onSubmit = async () => {
    setSubmitting(true);
    const payload: MutationAddCommentArgs = {
      id: fileId ?? folderId!,
      comment: text,
    };
    const result = await mutate(payload);
    await onComplete();
    setSubmitting(false);
    if (!result.error) setText('');
  };
  return (
    <>
      <Divider />
      <Textarea
        label="Add Comment"
        value={text}
        onChange={(event) => setText(event.currentTarget.value)}
        autosize
        autoFocus
        minRows={2}
        maxRows={4}
      />
      <Group justify="end">
        <Button
          variant="filled"
          disabled={text.length == 0}
          onClick={onSubmit}
          loading={submitting}
        >
          Add Comment
        </Button>
      </Group>
    </>
  );
};
