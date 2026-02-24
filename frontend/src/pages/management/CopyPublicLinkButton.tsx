import type { ButtonProps } from '@mantine/core';
import { Button } from '@mantine/core';
import { copyToClipboard, publicURLFor } from '../../helpers/copyToClipboard';
import { notifications } from '@mantine/notifications';
import { ClipboardIcon } from '../../PicrIcons';
import { useBaseUrl } from '../../hooks/useMe';

export const CopyPublicLinkButton = ({
  disabled,
  hash,
  folderId,
  ...props
}: {
  disabled: boolean;
  hash?: string;
  folderId?: string;
} & ButtonProps) => {
  const baseUrl = useBaseUrl();
  const url =
    hash && folderId ? publicURLFor(baseUrl ?? '', hash, folderId) : undefined;
  const notif = {
    title: 'Link copied to clipboard',
    message: url ?? '',
    icon: <ClipboardIcon />,
  };
  return (
    <Button
      {...props}
      disabled={disabled || !url}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!url) return;
        copyToClipboard(url);
        notifications.show(notif);
      }}
    >
      <ClipboardIcon />
      Copy Link
    </Button>
  );
};
