import { MinimalFile } from '../../../../types';
import { useMemo } from 'react';
import { metadataForFiltering } from '../../../helpers/metadataForFiltering';
import { AspectSelector } from './AspectSelector';
import { SearchBox } from './SearchBox';
import { MetadataBox } from './MetadataBox';
import {Box, Group, MantineStyleProp, Paper} from '@mantine/core';
import { Page } from '../../Page';

export const FilteringOptions = ({ files,style }: { files: MinimalFile[],style:MantineStyleProp }) => {
  const meta = useMemo(() => metadataForFiltering(files), [files]);
  //aperture
  //camera
  //lens
  //shutter
  //iso
  return (
    <Page style={style}>
      <Paper shadow="xs" withBorder p="md" mt="md" mb="md">
        <Group justify="space-between">
          <SearchBox />
          <AspectSelector />
          <Box>
            <MetadataBox files={files} metadata={meta} />
          </Box>
        </Group>
      </Paper>
    </Page>
  );
};
