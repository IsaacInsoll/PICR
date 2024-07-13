import { MinimalFile } from '../../../../types';
import { MetadataOptionsForFiltering } from '../../../helpers/metadataForFiltering';
import { MdCameraRoll, MdOutlineCameraRoll, MdOutlineShutterSpeed } from 'react-icons/md';
import { MetadataSummary } from '../../../gql/graphql';
import { useAtom, useAtomValue, useSetAtom } from 'jotai/index';
import { filterOptions, resetFilterOptions, totalMetadataFilterOptionsSelected } from '../../../atoms/filterAtom';
import { ReactNode } from 'react';
import { BsCamera, BsCamera2 } from 'react-icons/bs';
import { IoApertureOutline } from 'react-icons/io5';
import { Button, Group, Indicator, Modal, MultiSelect } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

export const MetadataBox = ({ files, metadata }: { files: MinimalFile[]; metadata: MetadataOptionsForFiltering }) => {
  const [opened, { open, close }] = useDisclosure(false);
  const totalMetadataSelected = useAtomValue(totalMetadataFilterOptionsSelected);
  const resetFilters = useSetAtom(resetFilterOptions);

  return (
    <>
      <Modal opened={opened} onClose={close} title="Metadata Filtering" centered>
        {Object.entries(metadata).map(([title, options]) => {
          return <MetadataSelect key={title} title={title as keyof MetadataSummary} options={options} />;
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
      <Indicator inline label={totalMetadataSelected} size={24} disabled={totalMetadataSelected == 0}>
        <Button onClick={open} variant={opened ? 'light' : 'default'} leftSection={<MdOutlineCameraRoll />}>
          Metadata
        </Button>
      </Indicator>
    </>
  );
};
const MetadataSelect = ({ title, options }: { title: keyof MetadataSummary; options: (string | number)[] }) => {
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
      description={solo ? 'Not available as all images are ' + options[0] : undefined}
      leftSection={iconList[title]}
      label={label}
      // placeholder={}
      value={value.map((v) => v.toString())}
      onChange={(strs) => {
        const newVals = data.filter((x) => strs.includes(x.value)).map((x) => x.raw);
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

const iconList: Record<keyof MetadataSummary, ReactNode> = {
  __typename: null,
  Camera: <BsCamera />,
  Lens: <BsCamera2 />,
  ISO: <MdCameraRoll />,
  ExposureTime: <MdOutlineShutterSpeed />,
  Aperture: <IoApertureOutline />,
  Artist: null,
  DateTimeEdit: null,
  DateTimeOriginal: null,
} as const;

const formatValues = (title: keyof MetadataSummary, options: (string | number)[]): formattedValue[] => {
  if (title === 'Aperture')
    return options.map((o) => ({
      value: o.toString(),
      label: 'ƒ' + o,
      raw: o,
    }));
  if (title === 'ExposureTime')
    return options.map((o) => {
      return {
        value: o.toString(),
        label: o > 1 ? o.toFixed(1) + ' sec' : '¹/' + (1 / o).toString(),
        raw: o,
      };
    });
  return options.map((o) => ({
    value: o.toString(),
    label: o.toString(),
    raw: o,
  }));
};

interface formattedValue {
  label: string;
  value: string;
  raw: string | number;
}
