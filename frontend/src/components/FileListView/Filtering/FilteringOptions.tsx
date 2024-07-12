import { MinimalFile } from '../../../../types';
import { useMemo } from 'react';
import { metadataForFiltering } from '../../../helpers/metadataForFiltering';
import { AspectSelector } from './AspectSelector';
import { SearchBox } from './SearchBox';
import { MetadataBox } from './MetadataBox';
import { Group, Paper } from '@mantine/core';
import { Page } from '../../Page';

export const FilteringOptions = ({ files }: { files: MinimalFile[] }) => {
  const meta = useMemo(() => metadataForFiltering(files), [files]);
  //aperture
  //camera
  //lens
  //shutter
  //iso
  return (
    <Page>
      <Paper shadow="xs" withBorder p="md">
        <Group>
          <SearchBox />
          <AspectSelector />
          <MetadataBox files={files} metadata={meta} />
        </Group>
      </Paper>
    </Page>
  );
};
