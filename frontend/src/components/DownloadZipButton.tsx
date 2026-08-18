import type { ButtonProps } from '@mantine/core';
import { Button } from '@mantine/core';
import { useState } from 'react';
import { atom } from 'jotai';
import { DownloadIcon } from '../PicrIcons';
import { useGenerateZip } from '../hooks/useGenerateZip';
import type { PicrFolder } from '@shared/types/picr';
import { useTranslation } from 'react-i18next';

// list of URLs we have requested to download that are currently generating.
// delete from list once you have triggered it's download
export type PendingZipDownload = {
  folder: PicrFolder;
  hash: string;
};

export const linksToDownloadAtom = atom<PendingZipDownload[]>([]);

export const DownloadZipButton = ({
  folder,
  disabled,
  ...props
}: {
  folder: PicrFolder;
  disabled?: boolean;
} & ButtonProps) => {
  const { t } = useTranslation('gallery');
  const [tempDisabled, setTempDisabled] = useState(false);
  const generateZip = useGenerateZip(folder, () => setTempDisabled(false));
  const handleClick = () => {
    void generateZip?.();
  };

  if (!generateZip) return null;
  return (
    <Button
      variant="filled"
      {...props}
      title={t('download.title')}
      onClick={handleClick}
      disabled={disabled || tempDisabled}
      leftSection={<DownloadIcon />}
    >
      {t('download.button')}
    </Button>
  );
};
