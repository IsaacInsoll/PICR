export type SocialLinkTypeKey =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'youtube'
  | 'twitter'
  | 'pinterest'
  | 'linkedin'
  | 'whatsapp'
  | 'vimeo'
  | 'google_review'
  | 'email'
  | 'phone'
  | 'website';

export interface SocialLinkTypeDefinition {
  key: SocialLinkTypeKey;
  label: string;
  domains?: string[];
  prefixes?: string[];
}

export const SOCIAL_LINK_TYPES: SocialLinkTypeDefinition[] = [
  { key: 'instagram', label: 'Instagram', domains: ['instagram.com'] },
  {
    key: 'facebook',
    label: 'Facebook',
    domains: ['facebook.com', 'fb.com', 'fb.me'],
  },
  { key: 'tiktok', label: 'TikTok', domains: ['tiktok.com'] },
  {
    key: 'youtube',
    label: 'YouTube',
    domains: ['youtube.com', 'youtu.be'],
  },
  { key: 'twitter', label: 'Twitter / X', domains: ['twitter.com', 'x.com'] },
  {
    key: 'pinterest',
    label: 'Pinterest',
    domains: ['pinterest.com', 'pin.it'],
  },
  { key: 'linkedin', label: 'LinkedIn', domains: ['linkedin.com'] },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    domains: ['wa.me', 'whatsapp.com'],
  },
  { key: 'vimeo', label: 'Vimeo', domains: ['vimeo.com'] },
  {
    key: 'google_review',
    label: 'Google Review',
    domains: ['g.page', 'maps.google.com', 'google.com/maps', 'goo.gl/maps'],
  },
  { key: 'email', label: 'Email', prefixes: ['mailto:'] },
  { key: 'phone', label: 'Phone / Call', prefixes: ['tel:'] },
  { key: 'website', label: 'Website' }, // catch-all / fallback
];

export interface SocialLink {
  type: SocialLinkTypeKey;
  title: string;
  url: string;
  openInNewTab: boolean;
}

/** Given a URL, return the best-matching type key, or 'website' as fallback. */
export function detectSocialLinkType(url: string): SocialLinkTypeKey {
  const lower = url.toLowerCase().trim();
  for (const def of SOCIAL_LINK_TYPES) {
    if (def.prefixes?.some((p) => lower.startsWith(p))) return def.key;
    if (def.domains?.some((d) => lower.includes(d))) return def.key;
  }
  return 'website';
}
