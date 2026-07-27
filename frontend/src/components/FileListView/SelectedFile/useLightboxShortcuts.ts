import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { ControllerRef } from 'yet-another-react-lightbox';
import { useMutation } from 'urql';
import { notifications } from '@mantine/notifications';
import { addCommentMutation } from '@shared/urql/mutations/addCommentMutation';
import { FileFlag } from '@shared/gql/graphql';
import { useAtomValue } from 'jotai';
import { useCommentPermissions } from '../../../hooks/useCommentPermissions';
import { modalTypeAtom, useOpenCommentsModal } from '../../../atoms/modalAtom';
import type { ReviewableFile } from '../Review/FileReview';

const CAPSLOCK_HINT_KEY = 'picr-lightbox-capslock-hint';
const TOAST_ID = 'lightbox-shortcut';
const LETTER_KEY = /^[a-z]$/i;

const shortcutKey = (e: KeyboardEvent) =>
  e.key.length === 1 ? e.key.toLowerCase() : e.key;

const capsLockEnabled = (e: KeyboardEvent) =>
  e.getModifierState('CapsLock') ||
  (LETTER_KEY.test(e.key) && e.key === e.key.toUpperCase() && !e.shiftKey);

// Keyboard shortcuts for the lightbox rating/review workflow. Active only while
// the lightbox is open and no modal/input has focus. Each action shows a brief
// Mantine toast so the (footer) rating change is confirmed even when the user's
// eyes are on the photo. When Caps Lock is on, a rate/flag auto-advances to the
// next slide (a one-time hint toast explains this the first time it happens),
// letting a reviewer power through a shoot without touching the mouse.
//
// Shortcuts: 1-5 rate, 0 clear rating, p/f approve, x reject, c comment.
export const useLightboxShortcuts = ({
  active,
  file,
  controllerRef,
}: {
  active: boolean;
  file?: ReviewableFile;
  controllerRef: RefObject<ControllerRef | null>;
}) => {
  const { canEdit, canView } = useCommentPermissions();
  const [, mutate] = useMutation(addCommentMutation);
  const openComment = useOpenCommentsModal();
  const modalOpen = !!useAtomValue(modalTypeAtom);

  // Keep the latest values in a ref so the keydown listener is registered once
  // per open (not re-bound on every slide change) while always seeing fresh data.
  const latest = useRef({
    file,
    canEdit,
    canView,
    modalOpen,
    mutate,
    openComment,
    controllerRef,
  });
  useEffect(() => {
    latest.current = {
      file,
      canEdit,
      canView,
      modalOpen,
      mutate,
      openComment,
      controllerRef,
    };
  });

  useEffect(() => {
    if (!active) return;

    const toast = (message: string, color?: string) =>
      notifications.show({
        id: TOAST_ID,
        message,
        color,
        autoClose: 1400,
        withCloseButton: false,
      });

    const maybeAutoAdvance = (capsLock: boolean) => {
      if (!capsLock) return;
      latest.current.controllerRef.current?.next();
      if (!localStorage.getItem(CAPSLOCK_HINT_KEY)) {
        localStorage.setItem(CAPSLOCK_HINT_KEY, '1');
        notifications.show({
          id: 'lightbox-capslock-hint',
          title: 'Caps Lock: auto-advance',
          message: 'Turn off Caps Lock to stay on the current photo.',
          autoClose: 5000,
        });
      }
    };

    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Don't hijack typing (comment box, search, etc.).
      const el = document.activeElement;
      const tag = el?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        (el instanceof HTMLElement && el.isContentEditable)
      ) {
        return;
      }

      const { file, canEdit, canView, modalOpen, mutate, openComment } =
        latest.current;
      // A modal (comments/info) owns the keyboard while it's open.
      if (modalOpen || !file) return;

      // Comment is available to anyone who can view comments.
      const key = shortcutKey(e);

      if (key === 'c') {
        if (!canView) return;
        e.preventDefault();
        openComment(file.id);
        return;
      }

      // The remaining shortcuts mutate, so require edit permission.
      if (!canEdit) return;

      const capsLock = capsLockEnabled(e);

      if (key >= '1' && key <= '5') {
        const rating = Number(key);
        e.preventDefault();
        void mutate({ id: file.id, rating });
        toast(`Rated ${'★'.repeat(rating)}`);
        maybeAutoAdvance(capsLock);
        return;
      }
      if (key === '0') {
        e.preventDefault();
        void mutate({ id: file.id, rating: 0 });
        toast('Rating cleared');
        maybeAutoAdvance(capsLock);
        return;
      }
      if (key === 'p' || key === 'f') {
        e.preventDefault();
        const approving = file.flag !== FileFlag.Approved;
        void mutate({
          id: file.id,
          flag: approving ? FileFlag.Approved : FileFlag.None,
        });
        toast(approving ? 'Approved' : 'Approval cleared', 'green');
        maybeAutoAdvance(capsLock);
        return;
      }
      if (key === 'x') {
        e.preventDefault();
        const rejecting = file.flag !== FileFlag.Rejected;
        void mutate({
          id: file.id,
          flag: rejecting ? FileFlag.Rejected : FileFlag.None,
        });
        toast(rejecting ? 'Rejected' : 'Rejection cleared', 'red');
        maybeAutoAdvance(capsLock);
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active]);
};
