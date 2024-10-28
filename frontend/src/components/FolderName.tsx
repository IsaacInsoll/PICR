import { MinimalFolder } from '../../types';
import { Code, Tooltip } from '@mantine/core';
import { TbChevronRight } from 'react-icons/tb';
import { HomeIcon } from '../PicrIcons';
import { PrettyFolderPath } from './PrettyFolderPath';

export const FolderName = ({ folder }: { folder: MinimalFolder }) => {
  return (
    <Tooltip
      withArrow={true}
      color="blue.9"
      disabled={folder.parents?.length == 0}
      label={<PrettyFolderPath folder={folder} subColor="blue.8" />}
    >
      <Code>
        {folder.id == 1 ? (
          <HomeIcon opacity={0.5} style={{ paddingTop: 3, marginRight: 2 }} />
        ) : null}
        {folder.name}
      </Code>
    </Tooltip>
  );
};

export const Joiner = () => {
  return <TbChevronRight style={{ opacity: 0.5 }} />;
};
