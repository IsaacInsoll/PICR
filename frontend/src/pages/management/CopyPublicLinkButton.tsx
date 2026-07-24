import type { ButtonProps } from '@mantine/core';
import { Button, Tooltip } from '@mantine/core';
import { copyToClipboard, publicURLFor } from '../../helpers/copyToClipboard';
import { notifications } from '@mantine/notifications';
import { ClipboardIcon } from '../../PicrIcons';
import { useBaseUrl } from '../../hooks/useMe';

export const CopyPublicLinkButton = ({
  disabled,
  hash,
  folderId,
  iconOnly = false,
  ...props
}: {
  disabled: boolean;
  hash?: string;
  folderId?: string;
  iconOnly?: boolean;
} & ButtonProps) => {
  const baseUrl = useBaseUrl();
  const url =
    hash && folderId ? publicURLFor(baseUrl ?? '', hash, folderId) : undefined;
  const notif = {
    title: 'Link copied to clipboard',
    message: url ?? '',
    icon: <ClipboardIcon />,
  };
  const button = (
    <Button
      {...props}
      disabled={disabled || !url}
      aria-label={iconOnly ? 'Copy link' : undefined}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!url) return;
        copyToClipboard(url);
        notifications.show(notif);
      }}
    >
      <ClipboardIcon />
      {iconOnly ? null : 'Copy Link'}
    </Button>
  );

  return iconOnly ? (
    <Tooltip label="Copy link">
      <span>{button}</span>
    </Tooltip>
  ) : (
    button
  );
};
