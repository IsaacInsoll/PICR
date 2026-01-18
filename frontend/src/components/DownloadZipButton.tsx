import { Button } from '@mantine/core';
import { useState } from 'react';
import { atom } from 'jotai/index';
import { Folder } from '../../../graphql-types';
import { FolderHash } from '../../../backend/helpers/zip';
import { DownloadIcon } from '../PicrIcons';
import { useGenerateZip } from '../hooks/useGenerateZip';

// list of URLs we have requested to download that are currently generating.
// delete from list once you have triggered it's download
export const linksToDownloadAtom = atom<FolderHash[]>([]);

export const DownloadZipButton = ({
  folder,
  disabled,
}: {
  folder: Folder;
  disabled?: boolean;
}) => {
  const generateZip = useGenerateZip(folder, () => setTempDisabled(false));
  const [tempDisabled, setTempDisabled] = useState(false);

  if (!generateZip) return null;
  return (
    <Button
      title="Download All Files"
      onClick={generateZip}
      variant="default"
      disabled={disabled || tempDisabled}
      leftSection={<DownloadIcon />}
    >
      Download
    </Button>
  );
};
