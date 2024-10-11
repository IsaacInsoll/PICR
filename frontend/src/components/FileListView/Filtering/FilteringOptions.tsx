import { MinimalFile } from '../../../../types';
import { useMemo } from 'react';
import { metadataForFiltering } from '../../../helpers/metadataForFiltering';
import { AspectSelector } from './AspectSelector';
import { SearchBox } from './SearchBox';
import { MetadataBox } from './MetadataBox';
import {
  Box,
  Divider,
  Group,
  MantineStyleProp,
  Paper,
  Stack,
} from '@mantine/core';
import { Page } from '../../Page';
import { useCommentPermissions } from '../../../hooks/useCommentPermissions';
import { FlagFilterBox } from './FlagFilterBox';
import { RatingFilterBox } from './RatingFilterBox';

export const FilteringOptions = ({
  files,
  style,
}: {
  files: MinimalFile[];
  style: MantineStyleProp;
}) => {
  const { canView } = useCommentPermissions();
  const meta = useMemo(() => metadataForFiltering(files), [files]);

  //aperture
  //camera
  //lens
  //shutter
  //iso
  return (
    <Page style={style}>
      <Paper shadow="xs" withBorder p="md" mt="md" mb="md">
        <Stack gap="sm">
          <Group justify="space-between">
            <SearchBox />
            <AspectSelector />
            <Box>
              <MetadataBox files={files} metadata={meta} />
            </Box>
          </Group>
          {canView ? (
            <>
              <Divider
                my={0}
                py={0}
                // label="Label in the center"
                // labelPosition="center"
              />
              <Group justify="space-between">
                <FlagFilterBox />
                <RatingFilterBox />
                {/*  Comments */}{' '}
              </Group>
            </>
          ) : null}
        </Stack>
      </Paper>
    </Page>
  );
};
