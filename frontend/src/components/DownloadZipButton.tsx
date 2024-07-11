import { ActionIcon, Button } from '@mantine/core';
import { generateZipMutation } from '../urql/mutations/generateZipMutation';
import { useMutation } from 'urql';
import { useState } from 'react';
import { atom, useAtom } from 'jotai/index';
import { Folder } from '../../../graphql-types';
import { FolderHash } from '../../../src/helpers/zip';
import { TbDownload } from 'react-icons/tb';

// list of URLs we have requested to download that are currently generating.
// delete from list once you have triggered it's download
export const linksToDownloadAtom = atom<FolderHash[]>([]);

export const DownloadZipButton = ({ folder }: { folder: Folder }) => {
  const [links, setLinks] = useAtom(linksToDownloadAtom);
  const [, mutate] = useMutation(generateZipMutation);
  const [disabled, setDisabled] = useState(false);

  const clickHandler = () => {
    setDisabled(true);
    mutate({ folderId: folder.id }).then((res) => {
      if (res?.data) {
        const fh: FolderHash = { folder, hash: res.data.generateZip };
        setLinks((l) => [...l, fh]);
        setDisabled(false);
      }
    });
  };

  return (
    <ActionIcon
      title="Download All Files"
      onClick={clickHandler}
      variant="default"
      disabled={disabled}
    >
      <TbDownload />
    </ActionIcon>
  );
};
