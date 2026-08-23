import type { ButtonProps } from '@mantine/core';
import { Button, Tooltip } from '@mantine/core';
import { copyToClipboard, publicURLFor } from '../../helpers/copyToClipboard';
import { notifications } from '@mantine/notifications';
import { ClipboardIcon } from '../../PicrIcons';
import { useBaseUrl } from '../../hooks/useMe';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('admin');
  const baseUrl = useBaseUrl();
  const url =
    hash && folderId ? publicURLFor(baseUrl ?? '', hash, folderId) : undefined;
  const notif = {
    title: t('links.copied'),
    message: url ?? '',
    icon: <ClipboardIcon />,
  };
  const button = (
    <Button
      {...props}
      disabled={disabled || !url}
      aria-label={iconOnly ? t('links.copy') : undefined}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!url) return;
        const copied = copyToClipboard(url);
        notifications.show({
          title: copied
            ? 'Link copied to clipboard'
            : "Couldn't copy link, copy it manually",
          message: url,
          color: copied ? undefined : 'red',
          icon: <ClipboardIcon />,
        });
      }}
    >
      <ClipboardIcon />
      {iconOnly ? null : t('links.copy')}
    </Button>
  );

  return iconOnly ? (
    <Tooltip label={t('links.copy')}>
      <span>{button}</span>
    </Tooltip>
  ) : (
    button
  );
};
