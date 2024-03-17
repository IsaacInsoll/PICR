import { Box, DropButton, SelectMultiple } from 'grommet';
import { Camera } from 'grommet-icons';
import { MinimalFile } from '../../../../types';
import { MetadataOptionsForFiltering } from '../../../helpers/metadataForFiltering';
import {
  MdCameraRoll,
  MdOutlineCameraRoll,
  MdOutlineCropFree,
  MdOutlineCropLandscape,
  MdOutlineCropPortrait,
  MdOutlineCropSquare,
  MdOutlineShutterSpeed,
} from 'react-icons/md';
import { MetadataSummary } from '../../../gql/graphql';
import { useAtom } from 'jotai/index';
import { filterOptions } from '../../../atoms/filterAtom';
import { ReactNode } from 'react';
import { BsCamera, BsCamera2 } from 'react-icons/bs';
import { LiaFilmSolid } from 'react-icons/lia';
import { IoApertureOutline } from 'react-icons/io5';
import { CiCamera } from 'react-icons/ci';

export const MetadataBox = ({
  files,
  metadata,
}: {
  files: MinimalFile[];
  metadata: MetadataOptionsForFiltering;
}) => {
  return (
    <DropButton
      style={{ borderRadius: 4, border: 'none' }}
      secondary={true}
      size="large"
      fill="vertical"
      icon={<MdOutlineCameraRoll />}
      label="..."
      dropContent={
        <Box pad="small" border={{ color: 'brand' }}>
          {Object.entries(metadata).map(([title, options]) => {
            return (
              <MetadataSelect
                key={title}
                title={title as keyof MetadataSummary}
                options={options}
              />
            );
          })}
        </Box>
      }
    />
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
  return (
    <SelectMultiple
      placeholder={title}
      disabled={options.length <= 1}
      icon={iconList[title]}
      options={options}
      value={value}
      onChange={({ value }) =>
        setFo((e) => ({ ...e, metadata: { ...e.metadata, [title]: value } }))
      }
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
