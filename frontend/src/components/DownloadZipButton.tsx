import { Button } from 'grommet';
import { Download } from 'grommet-icons';
import { generateZipMutation } from '../urql/mutations/generateZipMutation';
import { useMutation } from 'urql';
import { useState } from 'react';

// TODO: trigger download with mutation then download once it's completed OR download immediately if it's already generated

export const DownloadZipButton = ({ folderId }: { folderId: string }) => {
  const [, mutate] = useMutation(generateZipMutation);
  const [disabled, setDisabled] = useState(false);
  return (
    <Button
      icon={<Download />}
      title="Download All Files"
      // primary={filtering && !disabled}
      // disabled={disabled}
      onClick={() => {
        setDisabled(true);
        mutate({ folderId }).then(() => setDisabled(false));
      }}
      // badge={filtering ? total : undefined}
    />
  );
};
