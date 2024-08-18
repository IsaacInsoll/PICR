import { ReactNode } from 'react';
import { BsCamera, BsCamera2 } from 'react-icons/bs';
import { MdCameraRoll, MdOutlineShutterSpeed } from 'react-icons/md';
import { IoApertureOutline } from 'react-icons/io5';
import { MetadataSummary } from '../../../../graphql-types';
import { TbCalendar, TbCalendarBolt } from 'react-icons/tb';
import { LiaSignatureSolid } from 'react-icons/lia';

export const metadataIcons: Record<keyof MetadataSummary, ReactNode> = {
  __typename: null,
  Camera: <BsCamera />,
  Lens: <BsCamera2 />,
  ISO: <MdCameraRoll />,
  ExposureTime: <MdOutlineShutterSpeed />,
  Aperture: <IoApertureOutline />,
  Artist: <LiaSignatureSolid />,
  DateTimeEdit: <TbCalendarBolt />,
  DateTimeOriginal: <TbCalendar />,
} as const;
