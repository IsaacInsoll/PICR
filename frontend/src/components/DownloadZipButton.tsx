import { Button } from '@mantine/core';
import { useState } from 'react';
import { atom } from 'jotai';
import { DownloadIcon } from '../PicrIcons';
import { useGenerateZip } from '../hooks/useGenerateZip';
import type { PicrFolder } from '@shared/types/picr';

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
}: {
  folder: PicrFolder;
  disabled?: boolean;
}) => {
  const [tempDisabled, setTempDisabled] = useState(false);
  const generateZip = useGenerateZip(folder, () => setTempDisabled(false));
  const handleClick = () => {
    void generateZip?.();
  };

  if (!generateZip) return null;
  return (
    <Button
      title="Download All Files"
      onClick={handleClick}
      variant="default"
      disabled={disabled || tempDisabled}
      leftSection={<DownloadIcon />}
    >
      Download
    </Button>
  );
};
