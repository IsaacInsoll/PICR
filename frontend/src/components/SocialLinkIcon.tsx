import type { SocialLinkTypeKey } from '@shared/branding/socialLinkTypes';
import {
  TbBrandFacebook,
  TbBrandGoogle,
  TbBrandInstagram,
  TbBrandLinkedin,
  TbBrandPinterest,
  TbBrandTiktok,
  TbBrandVimeo,
  TbBrandWhatsapp,
  TbBrandX,
  TbBrandYoutube,
  TbMail,
  TbPhone,
  TbWorld,
} from 'react-icons/tb';
import type { IconType } from 'react-icons';

const iconMap: Record<SocialLinkTypeKey, IconType> = {
  instagram: TbBrandInstagram,
  facebook: TbBrandFacebook,
  tiktok: TbBrandTiktok,
  youtube: TbBrandYoutube,
  twitter: TbBrandX,
  pinterest: TbBrandPinterest,
  linkedin: TbBrandLinkedin,
  whatsapp: TbBrandWhatsapp,
  vimeo: TbBrandVimeo,
  google_review: TbBrandGoogle,
  email: TbMail,
  phone: TbPhone,
  website: TbWorld,
};

export const SocialLinkIcon = ({
  type,
  size,
}: {
  type: SocialLinkTypeKey;
  size?: number;
}) => {
  const Icon = iconMap[type] ?? TbWorld;
  return <Icon size={size} />;
};
