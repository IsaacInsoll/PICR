import type { MetadataOptionsForFiltering } from '@shared/files/metadataForFiltering';
import { MetadataIcon } from '../../../PicrIcons';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  resetFilterOptions,
  totalMetadataFilterOptionsSelected,
} from '@shared/filterAtom';
import { Button, Group, Indicator, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { MetadataSelect } from './MetadataSelect';
import type { AnyMetadataKey } from '@shared/fileMetadata';
import { useTranslation } from 'react-i18next';

export const MetadataBox = ({
  metadata,
}: {
  metadata: MetadataOptionsForFiltering;
}) => {
  const { t } = useTranslation('gallery');
  const [opened, { open, close }] = useDisclosure(false);
  const totalMetadataSelected = useAtomValue(
    totalMetadataFilterOptionsSelected,
  );
  const resetFilters = useSetAtom(resetFilterOptions);

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
            />
          );
        })}
        <Group pt="lg" grow>
          <Button
            variant="default"
            onClick={() => {
              resetFilters();
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
