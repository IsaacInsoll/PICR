import { Button, Divider, Group, Modal, Stack, Textarea } from '@mantine/core';
import { normalizeDisplayName } from '@shared/displayName';
import { LoadingIndicator } from '../../LoadingIndicator';
import {
  type ComponentPropsWithoutRef,
  forwardRef,
  Suspense,
  useState,
} from 'react';
import { useMutation, useQuery } from 'urql';
import type { PicrFile, PicrFolder } from '@shared/types/picr';
import { useCommentPermissions } from '../../../hooks/useCommentPermissions';
import { addCommentMutation } from '@shared/urql/mutations/addCommentMutation';
import { useIsSmallScreen } from '../../../hooks/useIsMobile';
import { commentHistoryQuery } from '@shared/urql/queries/commentHistoryQuery';
import { CommentHistory } from './CommentHistory';
import type { MutationAddCommentArgs } from '@shared/gql/graphql';
import { useTranslation } from 'react-i18next';
import {
  FileModalFileContext,
  FileModalLocationActions,
} from '../FileModalFileContext';
import { useCloseFileModal } from '../../../hooks/useFileModalNavigation';
import styles from './CommentModal.module.css';

const ModalScrollArea = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    {...props}
    className={[styles.modalScrollArea, className].filter(Boolean).join(' ')}
  />
));

ModalScrollArea.displayName = 'ModalScrollArea';

export const CommentModal = ({
  file,
  folder,
  highlight,
}: {
  file: PicrFile;
  folder?: PicrFolder;
  highlight?: string;
}) => {
  const { t } = useTranslation('gallery');
  const onClose = useCloseFileModal();
  const isMobile = useIsSmallScreen();
  const fileName = normalizeDisplayName(file.name);

  return (
    <Modal.Root
      opened={true}
      onClose={onClose}
      fullScreen={isMobile}
      centered={true}
      scrollAreaComponent={ModalScrollArea}
    >
      <Modal.Overlay />
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>{t('comments.onFile', { name: fileName })}</Modal.Title>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body className={styles.modalBody}>
          <Stack>
            <FileModalFileContext
              file={file}
              folder={folder}
              showLocationActions={false}
            />
            <Suspense fallback={<LoadingIndicator />}>
              <CommentBody file={file} highlight={highlight} />
            </Suspense>
          </Stack>
        </Modal.Body>
        <FileModalLocationActions
          file={file}
          equalWidth={true}
          className={styles.modalFooter}
        />
      </Modal.Content>
    </Modal.Root>
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
  const { t } = useTranslation('gallery');
  const [, mutate] = useMutation(addCommentMutation);
  const [submitting, setSubmitting] = useState(false);
  const { canEdit } = useCommentPermissions();
  const [text, setText] = useState('');

  if (!canEdit) return null;
  if (!fileId && !folderId)
    throw new Error('AddCommentBox requires either a fileId or folderId!');

  const onSubmit = async () => {
    const targetId = fileId ?? folderId;
    if (targetId === undefined) return;
    setSubmitting(true);
    const payload: MutationAddCommentArgs = {
      id: targetId,
      comment: text,
    };
    const result = await mutate(payload);
    await onComplete();
    setSubmitting(false);
    if (!result.error) setText('');
  };
  const handleSubmit = () => {
    void onSubmit();
  };
  return (
    <>
      <Divider />
      <Textarea
        label={t('comments.add')}
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
          disabled={text.length === 0}
          onClick={handleSubmit}
          loading={submitting}
        >
          {t('comments.add')}
        </Button>
      </Group>
    </>
  );
};
