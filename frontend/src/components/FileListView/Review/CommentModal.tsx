import {
  Button,
  Divider,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Textarea,
  Timeline,
} from '@mantine/core';
import { closeModalAtom } from '../../../atoms/modalAtom';
import { useSetAtom } from 'jotai/index';
import { LoadingIndicator } from '../../LoadingIndicator';
import { Suspense, useState } from 'react';
import { useMutation, useQuery } from 'urql';
import { MinimalFile } from '../../../../types';
import { CommentBodyItem } from './CommentBodyItem';
import { useCommentPermissions } from '../../../hooks/useCommentPermissions';
import { addCommentMutation } from './AddCommentMutation';
import { useIsSmallScreen } from '../../../hooks/useIsMobile';
import { commentHistoryQuery } from '../../../urql/queries/commentHistoryQuery';
import { CommentHistory } from './CommentHistory';

export const CommentModal = ({
  file,
  highlight,
}: {
  file: MinimalFile;
  highlight?: string;
}) => {
  const onClose = useSetAtom(closeModalAtom);

  const isMobile = useIsSmallScreen();

  console.log(file.id, highlight);

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
  file: MinimalFile;
  highlight?: string;
}) => {
  const [result, requery] = useQuery({
    query: commentHistoryQuery,
    variables: { fileId: file.id },
    requestPolicy: 'cache-and-network',
  });
  const [, mutate] = useMutation(addCommentMutation);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { commentPermissions, readOnly, canEdit } = useCommentPermissions();

  const onSubmit = async () => {
    setSubmitting(true);
    const result = await mutate({ id: file?.id, comment: text });
    await requery();
    setSubmitting(false);
    if (!result.error) setText('');
  };

  const comments = result.data.comments;

  return (
    <Stack>
      <ScrollArea>
        <CommentHistory
          comments={comments}
          singleFile={true}
          highlight={highlight}
        />
      </ScrollArea>
      {canEdit ? (
        <>
          <Divider />
          <Textarea
            label="Add Comment"
            value={text}
            onChange={(event) => setText(event.currentTarget.value)}
            autosize
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
      ) : null}
    </Stack>
  );
};
