import { MinimalFile } from '../../../../types';
import { ReactNode, useMemo } from 'react';
import { metadataForFiltering } from '../../../helpers/metadataForFiltering';
import { AspectSelector } from './AspectSelector';
import { SearchBox } from './SearchBox';
import { MetadataBox } from './MetadataBox';
import {
  Box,
  Container,
  Divider,
  Grid,
  Group,
  MantineStyleProp,
  Paper,
  Stack,
  StyleProp,
  Table,
  Text,
} from '@mantine/core';
import { Page } from '../../Page';
import { useCommentPermissions } from '../../../hooks/useCommentPermissions';
import { FlagFilterBox } from './FlagFilterBox';
import { RatingFilterBox } from './RatingFilterBox';
import { ColSpan } from '@mantine/core/lib/components/Grid/GridCol/GridCol';
import { CommentsFilterBox } from './CommentsFilterBox';
import { useIsMobile } from '../../../hooks/useIsMobile';

export const FilteringOptions = ({
  files,
  style,
}: {
  files: MinimalFile[];
  style: MantineStyleProp;
}) => {
  const isMobile = useIsMobile();

  return (
    <Container style={style} size="xs">
      {isMobile ? (
        <FilterTable files={files} />
      ) : (
        <Paper shadow="xs" withBorder p="md" mt="md" mb="md">
          <FilterTable files={files} />
        </Paper>
      )}
    </Container>
  );
};

const FilterTable = ({ files }) => {
  const { canView } = useCommentPermissions();
  const meta = useMemo(() => metadataForFiltering(files), [files]);
  return (
    <Table>
      <Table.Tbody>
        <Row label="Filename">
          <SearchBox />
        </Row>
        <Row label="Image Options">
          <Group justify="space-between">
            <AspectSelector />
            <Box>
              <MetadataBox files={files} metadata={meta} />
            </Box>
          </Group>
        </Row>
        {canView ? (
          <>
            <Row label="Flag">
              <FlagFilterBox />
            </Row>
            <Row label="Rating">
              <RatingFilterBox />
            </Row>
            <Row label="Comments">
              <CommentsFilterBox />
            </Row>
          </>
        ) : null}
      </Table.Tbody>
    </Table>
  );
};

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <Table.Tr>
    <Table.Td>
      <Text size="sm" c="dimmed">
        {label}
      </Text>
    </Table.Td>
    <Table.Td>{children}</Table.Td>
  </Table.Tr>
);
