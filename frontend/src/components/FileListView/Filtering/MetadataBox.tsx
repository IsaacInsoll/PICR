import { MinimalFile } from '../../../../types';
import { MetadataOptionsForFiltering } from '@shared/files/metadataForFiltering';
import { MdOutlineCameraRoll } from 'react-icons/md';
import {
  ImageMetadataSummary,
  VideoMetadataSummary,
} from '@shared/gql/graphql';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  resetFilterOptions,
  totalMetadataFilterOptionsSelected,
} from '@shared/filterAtom';
import { Button, Group, Indicator, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { MetadataSelect } from './MetadataSelect';

export type AnyMetadataKey =
  | keyof ImageMetadataSummary
  | keyof VideoMetadataSummary;

export const MetadataBox = ({
  files,
  metadata,
}: {
  files: MinimalFile[];
  metadata: MetadataOptionsForFiltering;
}) => {
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
        title="Metadata Filtering"
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
              resetFilters(null);
              close();
            }}
          >
            Clear All Filters
          </Button>
          <Button onClick={close}>Apply Filters</Button>
        </Group>
      </Modal>
      <Indicator
        inline
        label={totalMetadataSelected}
        size={24}
        disabled={totalMetadataSelected == 0}
      >
        <Button
          onClick={open}
          variant={opened ? 'light' : 'default'}
          leftSection={<MdOutlineCameraRoll />}
        >
          Metadata
        </Button>
      </Indicator>
    </>
  );
};

export interface formattedValue {
  label: string;
  value: string;
  raw: string | number;
}
