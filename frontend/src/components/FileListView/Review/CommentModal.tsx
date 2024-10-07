import {
  Box,
  Button,
  Divider,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Textarea,
  Timeline,
} from '@mantine/core';
import { commentDialogAtom } from '../../../atoms/commentDialogAtom';
import { useAtom } from 'jotai/index';
import { LoadingIndicator } from '../../LoadingIndicator';
import { Suspense, useState } from 'react';
import { gql } from '../../../helpers/gql';
import { useMutation, useQuery } from 'urql';
import { MinimalFile } from '../../../../types';
import { CommentBodyItem } from './CommentBodyItem';
import { addCommentMutation } from './addCommentMutation';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { useCommentPermissions } from '../../../hooks/useCommentPermissions';

export const CommentModal = () => {
  const [data, setData] = useAtom(commentDialogAtom);
  const isMobile = useIsMobile();
  const { file, open } = data;

  const onClose = () => setData((d) => ({ ...d, open: false }));

  return (
    <>
      <Modal
        opened={open}
        onClose={onClose}
        title={'Comments on ' + file?.name}
        fullScreen={isMobile}
      >
        <Suspense fallback={<LoadingIndicator />}>
          <CommentBody file={file} />
        </Suspense>
      </Modal>
    </>
  );
};

const CommentBody = ({ file }: { file: MinimalFile }) => {
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
        <Timeline active={1} bulletSize={24} lineWidth={2}>
          {comments.map((c) => (
            <CommentBodyItem comment={c} />
          ))}
        </Timeline>
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

const commentHistoryQuery = gql(/* GraphQL */ `
  query commentHistoryQuery($fileId: ID!) {
    comments(fileId: $fileId) {
      id
      comment
      systemGenerated
      timestamp
      user {
        id
      }
    }
  }
`);
