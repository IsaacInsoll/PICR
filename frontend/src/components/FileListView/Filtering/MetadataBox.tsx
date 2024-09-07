import { MinimalFile } from '../../../../types';
import { MetadataOptionsForFiltering } from '../../../helpers/metadataForFiltering';
import { MdOutlineCameraRoll } from 'react-icons/md';
import {
  ImageMetadataSummary,
  VideoMetadataSummary,
} from '../../../gql/graphql';
import { useAtom, useAtomValue, useSetAtom } from 'jotai/index';
import {
  filterOptions,
  resetFilterOptions,
  totalMetadataFilterOptionsSelected,
} from '../../../atoms/filterAtom';
import { Button, Group, Indicator, Modal, MultiSelect } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { metadataIcons } from '../metadataIcons';
import { prettyDateNoTZ } from './PrettyDate';
import prettyBytes from 'pretty-bytes';
import humanizeDuration from 'humanize-duration';

type AnyMetadataKey = keyof ImageMetadataSummary | typeof VideoMetadataSummary;

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
const MetadataSelect = ({
  title,
  options,
}: {
  title: AnyMetadataKey;
  options: (string | number)[];
}) => {
  const [fo, setFo] = useAtom(filterOptions);
  const value = options.length === 1 ? options : fo.metadata[title] ?? [];
  const data = formatValues(title, options);

  const label = title === 'ExposureTime' ? 'Shutter Speed' : title;
  // <MultiSelect> only accepts string values so we need to do some conversion back-and-forth as some metadata is numeric such as aperture and shutter speed

  const solo = options.length <= 1;

  return (
    <MultiSelect
      clearable
      checkIconPosition="right"
      data={data}
      disabled={solo}
      description={
        solo ? 'Not available as all images are ' + options[0] : undefined
      }
      leftSection={metadataIcons[title]}
      label={label}
      // placeholder={}
      value={value.map((v) => v.toString())}
      onChange={(strs) => {
        const newVals = data
          .filter((x) => strs.includes(x.value))
          .map((x) => x.raw);
        setFo((e) => ({
          ...e,
          metadata: {
            ...e.metadata,
            [title]: newVals,
          },
        }));
      }}
    />
  );
};

const formatValues = (
  title: AnyMetadataKey,
  options: (string | number)[],
): formattedValue[] => {
  return options.map((o) => formatValue(title, o));
};

export const formatValue = (
  title: AnyMetadataKey,
  value: string | number,
): formattedValue => {
  if (title === 'Aperture')
    return {
      value: value.toString(),
      label: 'ƒ' + value,
      raw: value,
    };
  if (title === 'ExposureTime')
    return {
      value: value.toString(),
      label:
        value > 1 ? value.toFixed(1) + ' sec' : '¹/' + (1 / value).toString(),
      raw: value,
    };

  if (title.startsWith('DateTime')) {
    return {
      value: value,
      label: prettyDateNoTZ(value),
      raw: value,
    };
  }

  if (title === 'Bitrate')
    return {
      value: value ? value.toString() : '',
      label: value ? prettyBytes(value, { bits: true }) : '',
      raw: value,
    };
  if (title === 'Duration' && value) {
    return {
      value: value ? value.toString() : '',
      label: humanizeDuration(value * 1000, { round: true }),
    };
  }
  return {
    value: value ? value.toString() : '',
    label: value ? value.toString() : '',
    raw: value,
  };
};

interface formattedValue {
  label: string;
  value: string;
  raw: string | number;
}
