import { MinimalFile } from '../../../../types';
import { ReactNode, useMemo } from 'react';
import { metadataForFiltering } from '../../../helpers/metadataForFiltering';
import { AspectSelector } from './AspectSelector';
import { SearchBox } from './SearchBox';
import { MetadataBox } from './MetadataBox';
import {
  Alert,
  Box,
  Button,
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
import { TbFileInfo, TbInfoCircle } from 'react-icons/tb';
import {
  resetFilterOptions,
  totalFilterOptionsSelected,
} from '../../../atoms/filterAtom';
import { useAtomValue } from 'jotai';
import { useSetAtom } from 'jotai/index';

export const FilteringOptions = ({
  files,
  style,
  totalFiltered,
}: {
  files: MinimalFile[];
  style: MantineStyleProp;
  totalFiltered: number;
}) => {
  const isMobile = useIsMobile();

  return (
    <Container style={style} size="xs">
      {isMobile ? (
        <FilterTable files={files} totalFiltered={totalFiltered} />
      ) : (
        <Paper shadow="xs" withBorder p="md" mt="md" mb="md">
          <FilterTable files={files} totalFiltered={totalFiltered} />
        </Paper>
      )}
    </Container>
  );
};

const FilterTable = ({ files, totalFiltered }) => {
  const { canView } = useCommentPermissions();
  const meta = useMemo(() => metadataForFiltering(files), [files]);
  const totalFilters = useAtomValue(totalFilterOptionsSelected);
  const resetFilters = useSetAtom(resetFilterOptions);
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
        <Table.Tr>
          <Table.Td colSpan={2} pt="md">
            <Group>
              <Box flex={1}>
                {totalFilters > 0 ? (
                  <Alert
                    variant="light"
                    color="blue"
                    icon={<TbInfoCircle />}
                    p={8}
                  >
                    {totalFiltered == files.length
                      ? 'Showing all files'
                      : `Showing ${totalFiltered} of ${files.length} files`}
                  </Alert>
                ) : null}
              </Box>
              <Button
                variant="outline"
                size="sm"
                disabled={totalFilters == 0}
                onClick={() => resetFilters()}
              >
                Clear {totalFilters > 0 ? totalFilters : ''} Filters
              </Button>
            </Group>
          </Table.Td>
        </Table.Tr>
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
