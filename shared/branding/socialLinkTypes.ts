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

const socialHandleBaseUrls: Partial<Record<SocialLinkTypeKey, string>> = {
  instagram: 'https://instagram.com',
  facebook: 'https://facebook.com',
  tiktok: 'https://tiktok.com',
  twitter: 'https://x.com',
  pinterest: 'https://pinterest.com',
  linkedin: 'https://linkedin.com/in',
  vimeo: 'https://vimeo.com',
};

const hasScheme = (value: string): boolean =>
  /^[a-z][a-z0-9+.-]*:/i.test(value.trim());

const looksLikeHostOrPath = (value: string): boolean =>
  value.includes('.') || value.includes('/') || value.startsWith('www.');

const stripPrefix = (value: string, prefix: string): string =>
  value.toLowerCase().startsWith(prefix) ? value.slice(prefix.length) : value;

export function normalizeSocialLinkInput(
  type: SocialLinkTypeKey,
  input: string,
): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  if (type === 'email') {
    const withoutPrefix = stripPrefix(trimmed, 'mailto:').trim();
    return withoutPrefix ? `mailto:${withoutPrefix}` : '';
  }

  if (type === 'phone') {
    const withoutPrefix = stripPrefix(trimmed, 'tel:');
    const normalized = withoutPrefix
      .replace(/[^\d+]/g, '')
      .replace(/(?!^)\+/g, '');
    return normalized ? `tel:${normalized}` : '';
  }

  if (hasScheme(trimmed)) {
    return trimmed;
  }

  if (looksLikeHostOrPath(trimmed)) {
    return `https://${trimmed.replace(/^\/+/, '')}`;
  }

  const base = socialHandleBaseUrls[type];
  if (!base) return trimmed;

  const handle = trimmed.replace(/^@+/, '');
  if (!handle) return '';
  if (type === 'tiktok') return `${base}/@${handle}`;
  return `${base}/${handle}`;
}

export function normalizeSocialLink(link: SocialLink): SocialLink {
  return {
    ...link,
    url: normalizeSocialLinkInput(link.type, link.url),
  };
}

export function normalizeSocialLinks(
  links: SocialLink[] | null | undefined,
): SocialLink[] | null | undefined {
  if (links === undefined) return undefined;
  if (links === null) return null;
  return links.map(normalizeSocialLink);
}

export function shouldAutoDetectSocialLinkType(input: string): boolean {
  const value = input.trim().toLowerCase();
  if (!value) return false;
  if (hasScheme(value)) return true;
  return value.includes('.') || value.includes('/');
}
