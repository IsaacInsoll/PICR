import { ReactNode } from 'react';
import { BsCamera, BsCamera2 } from 'react-icons/bs';
import {
  MdCameraRoll,
  MdOutlineNetworkCheck,
  MdOutlineShutterSpeed,
} from 'react-icons/md';
import { IoApertureOutline } from 'react-icons/io5';
import {
  ImageMetadataSummary,
  VideoMetadataSummary,
} from '../../../../graphql-types';
import {
  TbArrowAutofitHeight,
  TbArrowAutofitWidth,
  TbAspectRatio,
  TbBrandSpeedtest,
  TbCalendar,
  TbCalendarBolt,
  TbClock,
  TbFile,
  TbPhotoVideo,
  TbVolume,
} from 'react-icons/tb';
import { LiaSignatureSolid } from 'react-icons/lia';
import { GiStarsStack } from 'react-icons/gi';

export const metadataIcons: Record<
  keyof ImageMetadataSummary | keyof VideoMetadataSummary,
  ReactNode
> = {
  __typename: null,
  //PHOTO
  Camera: <BsCamera />,
  Lens: <BsCamera2 />,
  ISO: <MdCameraRoll />,
  ExposureTime: <MdOutlineShutterSpeed />,
  Aperture: <IoApertureOutline />,
  Artist: <LiaSignatureSolid />,
  DateTimeEdit: <TbCalendarBolt />,
  DateTimeOriginal: <TbCalendar />,
  //VIDEO
  Audio: <TbVolume />,
  Framerate: <TbBrandSpeedtest />,
  Height: <TbArrowAutofitHeight />,
  Width: <TbArrowAutofitWidth />,
  Video: <TbPhotoVideo />,
  Format: <TbFile />,
  Duration: <TbClock />,
  Bitrate: <MdOutlineNetworkCheck />,
  AspectRatio: <TbAspectRatio />,
  Rating: <GiStarsStack />,
} as const;
