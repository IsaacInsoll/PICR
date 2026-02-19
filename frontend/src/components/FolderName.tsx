import { PicrFolder } from '../../types';
import { Code, Tooltip } from '@mantine/core';
import { ChevronRightIcon, HomeIcon } from '../PicrIcons';
import { PrettyFolderPath } from './PrettyFolderPath';
import { useSetFolder } from '../hooks/useSetFolder';
import { useBaseViewFolderURL } from '../hooks/useBaseViewFolderURL';
import { PicrLink } from './PicrLink';

export const FolderName = ({ folder }: { folder: PicrFolder }) => {
  const setFolder = useSetFolder();
  const baseURL = useBaseViewFolderURL();

  return (
    <Tooltip
      withArrow={true}
      color="blue.9"
      disabled={folder.parents?.length == 0}
      label={<PrettyFolderPath folder={folder} subColor="blue.8" />}
    >
      <PicrLink
        to={baseURL + folder.id}
        underline="never"
        onClick={(e) => {
          e.preventDefault();
          setFolder(folder);
        }}
      >
        <Code>
          {folder.id == '1' ? (
            <HomeIcon opacity={0.5} style={{ paddingTop: 3, marginRight: 2 }} />
          ) : null}
          {folder.name}
        </Code>
      </PicrLink>
    </Tooltip>
  );
};

export const Joiner = () => {
  return <ChevronRightIcon style={{ opacity: 0.5 }} />;
};
