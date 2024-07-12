import { MinimalFile } from '../../../../types';
import { MetadataOptionsForFiltering } from '../../../helpers/metadataForFiltering';
import {
  MdCameraRoll,
  MdOutlineCameraRoll,
  MdOutlineShutterSpeed,
} from 'react-icons/md';
import { MetadataSummary } from '../../../gql/graphql';
import { useAtom, useAtomValue } from 'jotai/index';
import {
  filterOptions,
  totalFilterOptionsSelected,
} from '../../../atoms/filterAtom';
import { ReactNode } from 'react';
import { BsCamera, BsCamera2 } from 'react-icons/bs';
import { IoApertureOutline } from 'react-icons/io5';
import { ActionIcon, Button, Modal, MultiSelect, Popover } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { label } from 'yet-another-react-lightbox';

export const MetadataBox = ({
  files,
  metadata,
}: {
  files: MinimalFile[];
  metadata: MetadataOptionsForFiltering;
}) => {
  const [opened, { open, close }] = useDisclosure(false);
  const total = useAtomValue(totalFilterOptionsSelected);

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
              title={title as keyof MetadataSummary}
              options={options}
            />
          );
        })}
      </Modal>
      <Button
        onClick={open}
        variant={opened ? 'filled' : 'default'}
        leftSection={<MdOutlineCameraRoll />}
      >
        Metadata {total ? `(${total})` : null}
      </Button>
    </>
  );
};
const MetadataSelect = ({
  title,
  options,
}: {
  title: keyof MetadataSummary;
  options: (string | number)[];
}) => {
  const [fo, setFo] = useAtom(filterOptions);
  const value = options.length === 1 ? options : fo.metadata[title] ?? [];
  const data = formatValues(title, options);

  const label = title === 'ExposureTime' ? 'Shutter Speed' : title;
  // <MultiSelect> only accepts string values so we need to do some conversion back-and-forth as some metadata is numeric such as aperture and shutter speed
  return (
    <MultiSelect
      clearable
      checkIconPosition="right"
      data={data}
      disabled={options.length <= 1}
      leftSection={iconList[title]}
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

const formatValues = (
  title: keyof MetadataSummary,
  options: (string | number)[],
): formattedValue[] => {
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
