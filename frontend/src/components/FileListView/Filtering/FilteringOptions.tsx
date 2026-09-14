import type { PicrFile } from '@shared/types/picr';
import {
  countGalleryFilterCriteria,
  type GalleryFilterCriteria,
} from '@shared/files/mediaCriteria';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { metadataForFiltering } from '@shared/files/metadataForFiltering';
import { AspectSelector } from './AspectSelector';
import { MediaTypeSelector } from './MediaTypeSelector';
import { MetadataBox } from './MetadataBox';
import {
  Alert,
  Box,
  Button,
  Divider,
  Grid,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import { useCommentPermissions } from '../../../hooks/useCommentPermissions';
import { FlagFilterBox } from './FlagFilterBox';
import { RatingFilterBox } from './RatingFilterBox';
import { CommentsFilterBox } from './CommentsFilterBox';
import { InfoIcon } from '../../../PicrIcons';
import { useTranslation } from 'react-i18next';

export const FilteringOptions = ({
  files,
  totalFiltered,
  filters,
  onChange,
  onReset,
  onClose,
  showMetadata = true,
  showCountSummary = true,
  showMediaTypeAlways = false,
  activeFilterCount,
}: {
  files: PicrFile[];
  totalFiltered: number;
  filters: GalleryFilterCriteria;
  onChange: (filters: GalleryFilterCriteria) => void;
  onReset: () => void;
  onClose: () => void;
  showMetadata?: boolean;
  showCountSummary?: boolean;
  showMediaTypeAlways?: boolean;
  activeFilterCount?: number;
}) => {
  const { t } = useTranslation('gallery');
  const { canView } = useCommentPermissions();
  const meta = useMemo(
    () => metadataForFiltering(files.filter((f) => f.type === 'Image')),
    [files],
  );
  const totalFilters = activeFilterCount ?? countGalleryFilterCriteria(filters);
  const hasMultipleMediaTypes = useMemo(
    () => new Set(files.map((file) => file.type)).size > 1,
    [files],
  );
  return (
    <Stack gap={0}>
      {showMediaTypeAlways ||
      hasMultipleMediaTypes ||
      filters.mediaType !== 'All' ? (
        <Row label={t('filter.mediaType')}>
          <MediaTypeSelector filters={filters} onChange={onChange} />
        </Row>
      ) : null}
      <Row label={t('filter.imageOptions')}>
        <Group justify="space-between">
          <AspectSelector filters={filters} onChange={onChange} />
          {showMetadata ? (
            <Box>
              <MetadataBox
                metadata={meta}
                filters={filters}
                onChange={onChange}
                onReset={onReset}
              />
            </Box>
          ) : null}
        </Group>
      </Row>
      {canView ? (
        <>
          <Row label={t('filter.flag')}>
            <FlagFilterBox filters={filters} onChange={onChange} />
          </Row>
          <Row label={t('filter.rating')}>
            <RatingFilterBox filters={filters} onChange={onChange} />
          </Row>
          <Row label={t('filter.comments')}>
            <CommentsFilterBox filters={filters} onChange={onChange} />
          </Row>
        </>
      ) : null}
      <Group pt="md" align="flex-end">
        <Box flex={1} miw={180}>
          {showCountSummary && totalFilters > 0 ? (
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
          onClick={onReset}
        >
          {totalFilters > 0
            ? t('filter.clear', { count: totalFilters })
            : t('filter.clearNone')}
        </Button>
        <Button variant="outline" size="sm" onClick={onClose}>
          {t('filter.close')}
        </Button>
      </Group>
    </Stack>
  );
};

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <>
    <Grid gap="xs" align="center" py="xs">
      <Grid.Col span={{ base: 12, xs: 3 }}>
        <Text size="sm" c="dimmed">
          {label}
        </Text>
      </Grid.Col>
      <Grid.Col span={{ base: 12, xs: 9 }}>{children}</Grid.Col>
    </Grid>
    <Divider />
  </>
);
