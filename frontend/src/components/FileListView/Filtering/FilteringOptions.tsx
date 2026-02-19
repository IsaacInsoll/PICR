import { PicrFile } from '../../../../types';
import { ReactNode, useMemo } from 'react';
import { metadataForFiltering } from '@shared/files/metadataForFiltering';
import { Image } from '@shared/gql/graphql';
import { AspectSelector } from './AspectSelector';
import { SearchBox } from './SearchBox';
import { MetadataBox } from './MetadataBox';
import {
  Alert,
  Box,
  Button,
  Container,
  Group,
  MantineStyleProp,
  Paper,
  Table,
  Text,
} from '@mantine/core';
import { useCommentPermissions } from '../../../hooks/useCommentPermissions';
import { FlagFilterBox } from './FlagFilterBox';
import { RatingFilterBox } from './RatingFilterBox';
import { CommentsFilterBox } from './CommentsFilterBox';
import { useIsMobile } from '../../../hooks/useIsMobile';
import {
  filterAtom,
  resetFilterOptions,
  totalFilterOptionsSelected,
} from '@shared/filterAtom';
import { useAtomValue } from 'jotai';
import { useSetAtom } from 'jotai/index';
import { InfoIcon } from '../../../PicrIcons';

export const FilteringOptions = ({
  files,
  style,
  totalFiltered,
}: {
  files: PicrFile[];
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

const FilterTable = ({
  files,
  totalFiltered,
}: {
  files: PicrFile[];
  totalFiltered: number;
}) => {
  const setFiltering = useSetAtom(filterAtom);
  const { canView } = useCommentPermissions();
  const meta = useMemo(
    () =>
      metadataForFiltering(
        files.filter((f) => f.type === 'Image') as unknown as Image[],
      ),
    [files],
  );
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
              <MetadataBox metadata={meta} />
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
                  <Alert variant="light" icon={<InfoIcon />} p={8}>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiltering(false)}
              >
                Close
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
