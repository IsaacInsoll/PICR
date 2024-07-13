import { ActionIcon, Button } from '@mantine/core';
import { generateZipMutation } from '../urql/mutations/generateZipMutation';
import { useMutation } from 'urql';
import { useState } from 'react';
import { atom, useAtom } from 'jotai/index';
import { Folder } from '../../../graphql-types';
import { FolderHash } from '../../../src/helpers/zip';
import { TbDownload } from 'react-icons/tb';
import { actionIconSize } from '../theme';

// list of URLs we have requested to download that are currently generating.
// delete from list once you have triggered it's download
export const linksToDownloadAtom = atom<FolderHash[]>([]);

export const DownloadZipButton = ({ folder,disabled }: { folder: Folder,disabled?: boolean }) => {
  const [links, setLinks] = useAtom(linksToDownloadAtom);
  const [, mutate] = useMutation(generateZipMutation);
  const [tempDisabled, setTempDisabled] = useState(false);

  const clickHandler = () => {
    setTempDisabled(true);
    mutate({ folderId: folder.id }).then((res) => {
      if (res?.data) {
        const fh: FolderHash = { folder, hash: res.data.generateZip };
        setLinks((l) => [...l, fh]);
        setTempDisabled(false);
      }
    });
  };

  return (
    <Button
      title="Download All Files"
      onClick={clickHandler}
      variant="default"
      disabled={disabled || tempDisabled}
      leftSection={<TbDownload />}
    >
      Download .ZIP
    </Button>
  );
};
