import type { PicrFile } from '@shared/types/picr';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { metadataForFiltering } from '@shared/files/metadataForFiltering';
import { AspectSelector } from './AspectSelector';
import { SearchBox } from './SearchBox';
import { MetadataBox } from './MetadataBox';
import type { MantineStyleProp } from '@mantine/core';
import {
  Alert,
  Box,
  Button,
  Container,
  Group,
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
import { useAtomValue, useSetAtom } from 'jotai';
import { InfoIcon } from '../../../PicrIcons';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('gallery');
  const setFiltering = useSetAtom(filterAtom);
  const { canView } = useCommentPermissions();
  const meta = useMemo(
    () => metadataForFiltering(files.filter((f) => f.type === 'Image')),
    [files],
  );
  const totalFilters = useAtomValue(totalFilterOptionsSelected);
  const resetFilters = useSetAtom(resetFilterOptions);
  return (
    <Table>
      <Table.Tbody>
        <Row label={t('filter.filename')}>
          <SearchBox />
        </Row>
        <Row label={t('filter.imageOptions')}>
          <Group justify="space-between">
            <AspectSelector />
            <Box>
              <MetadataBox metadata={meta} />
            </Box>
          </Group>
        </Row>
        {canView ? (
          <>
            <Row label={t('filter.flag')}>
              <FlagFilterBox />
            </Row>
            <Row label={t('filter.rating')}>
              <RatingFilterBox />
            </Row>
            <Row label={t('filter.comments')}>
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
                    {totalFiltered === files.length
                      ? t('filter.showingAll')
                      : t('filter.showingCount', {
                          visible: totalFiltered,
                          total: files.length,
                        })}
                  </Alert>
                ) : null}
              </Box>
              <Button
                variant="outline"
                size="sm"
                disabled={totalFilters === 0}
                onClick={() => resetFilters()}
              >
                {totalFilters > 0
                  ? t('filter.clear', { count: totalFilters })
                  : t('filter.clearNone')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiltering(false)}
              >
                {t('filter.close')}
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
