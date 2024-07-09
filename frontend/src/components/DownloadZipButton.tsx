import { Button } from 'grommet';
import { Download } from 'grommet-icons';
import { generateZipMutation } from '../urql/mutations/generateZipMutation';
import { useMutation } from 'urql';
import { useState } from 'react';
import { atom, useAtom } from 'jotai/index';
import { l } from 'vite/dist/node/types.d-aGj9QkWt';
import { Folder } from '../../../graphql-types';
import { FolderHash } from '../../../src/helpers/zip';

// list of URLs we have requested to download that are currently generating.
// delete from list once you have triggered it's download
export const linksToDownloadAtom = atom<FolderHash[]>([]);

export const DownloadZipButton = ({ folder }: { folder: Folder }) => {
  const [links, setLinks] = useAtom(linksToDownloadAtom);
  const [, mutate] = useMutation(generateZipMutation);
  const [disabled, setDisabled] = useState(false);

  console.log(links);

  return (
    <Button
      icon={<Download />}
      title="Download All Files"
      badge={links.length > 0}
      // primary={filtering && !disabled}
      disabled={disabled}
      onClick={() => {
        setDisabled(true);
        mutate({ folderId: folder.id }).then((res) => {
          if (res?.data) {
            const fh: FolderHash = { folder, hash: res.data.generateZip };
            setLinks((l) => [...l, fh]);
            setDisabled(false);
          }
        });
      }}
      // badge={filtering ? total : undefined}
    />
  );
};
