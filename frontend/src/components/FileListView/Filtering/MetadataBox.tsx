import type { MetadataOptionsForFiltering } from '@shared/files/metadataForFiltering';
import type { GalleryFilterCriteria } from '@shared/files/mediaCriteria';
import { MetadataIcon } from '../../../PicrIcons';
import { Button, Group, Indicator, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { MetadataSelect } from './MetadataSelect';
import type { AnyMetadataKey } from '@shared/fileMetadata';
import { useTranslation } from 'react-i18next';

export const MetadataBox = ({
  metadata,
  filters,
  onChange,
  onReset,
}: {
  metadata: MetadataOptionsForFiltering;
  filters: GalleryFilterCriteria;
  onChange: (filters: GalleryFilterCriteria) => void;
  onReset: () => void;
}) => {
  const { t } = useTranslation('gallery');
  const [opened, { open, close }] = useDisclosure(false);
  const totalMetadataSelected = Object.values(filters.metadata).filter(
    (values) => values.length,
  ).length;

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title={t('filter.metadataFiltering')}
        centered
      >
        {Object.entries(metadata).map(([title, options]) => {
          return (
            <MetadataSelect
              key={title}
              title={title as AnyMetadataKey}
              options={options}
              filters={filters}
              onChange={onChange}
            />
          );
        })}
        <Group pt="lg" grow>
          <Button
            variant="default"
            onClick={() => {
              onReset();
              close();
            }}
          >
            {t('filter.clearAll')}
          </Button>
          <Button onClick={close}>{t('filter.apply')}</Button>
        </Group>
      </Modal>
      <Indicator
        inline
        label={totalMetadataSelected}
        size={24}
        disabled={totalMetadataSelected === 0}
      >
        <Button
          onClick={open}
          variant={opened ? 'light' : 'default'}
          leftSection={<MetadataIcon />}
        >
          {t('filter.metadata')}
        </Button>
      </Indicator>
    </>
  );
};
