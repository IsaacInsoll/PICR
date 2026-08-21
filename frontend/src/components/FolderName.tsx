import type { PicrFolder } from '@shared/types/picr';
import { Code, Tooltip } from '@mantine/core';
import { ChevronRightIcon, HomeIcon } from '../PicrIcons';
import { PrettyFolderPath } from './PrettyFolderPath';
import { useFolderLink } from '../hooks/useSetFolder';
import { PicrLink } from './PicrLink';
import { useFolderNameFormatter } from '../i18n/useFolderNameFormatter';

export const FolderName = ({ folder }: { folder: PicrFolder }) => {
  const { to } = useFolderLink(folder);
  const formatFolderName = useFolderNameFormatter();
  const folderName = formatFolderName(folder);

  return (
    <Tooltip
      withArrow={true}
      color="blue.9"
      disabled={folder.parents?.length === 0}
      label={<PrettyFolderPath folder={folder} subColor="blue.8" />}
    >
      <PicrLink to={to} underline="never">
        <Code>
          {folder.parentId === null ? (
            <HomeIcon opacity={0.5} style={{ paddingTop: 3, marginRight: 2 }} />
          ) : null}
          {folderName}
        </Code>
      </PicrLink>
    </Tooltip>
  );
};

export const Joiner = () => {
  return <ChevronRightIcon style={{ opacity: 0.5 }} />;
};
