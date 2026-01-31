export type FontCategory =
  | 'sans'
  | 'serif'
  | 'display'
  | 'script'
  | 'mono'
  | 'accessibility';

export interface FontDefinition {
  key: string;
  label: string;
  category: FontCategory;
  weights: number[];
  headingOnly: boolean;
  description: string;
  suitableFor: string[];
}

export const fontRegistry = [
  {
    key: 'default',
    label: 'PICR Default (Signika)',
    category: 'sans',
    weights: [400, 600, 700],
    headingOnly: false,
    description:
      'Friendly, slightly rounded, approachable; current PICR heading font.',
    suitableFor: ['family', 'kids', 'casual lifestyle', 'general galleries'],
  },
  {
    key: 'signika',
    label: 'Signika',
    category: 'sans',
    weights: [400, 600, 700],
    headingOnly: false,
    description: 'Friendly, slightly rounded, approachable.',
    suitableFor: ['family', 'kids', 'casual lifestyle'],
  },
  {
    key: 'inter',
    label: 'Inter',
    category: 'sans',
    weights: [400, 500, 700],
    headingOnly: false,
    description: 'Crisp modern UI sans; neutral and highly readable.',
    suitableFor: ['commercial', 'product', 'documentary', 'modern portfolios'],
  },
  {
    key: 'source-sans-3',
    label: 'Source Sans 3',
    category: 'sans',
    weights: [400, 500, 700],
    headingOnly: false,
    description: 'Calm editorial sans; clean and versatile.',
    suitableFor: ['weddings', 'portraits', 'storytelling galleries'],
  },
  {
    key: 'manrope',
    label: 'Manrope',
    category: 'sans',
    weights: [400, 500, 700],
    headingOnly: false,
    description: 'Minimal, geometric, contemporary.',
    suitableFor: ['architecture', 'interiors', 'design-forward portfolios'],
  },
  {
    key: 'merriweather-sans',
    label: 'Merriweather Sans',
    category: 'sans',
    weights: [300, 400, 700],
    headingOnly: false,
    description: 'Balanced and slightly classic sans.',
    suitableFor: ['travel', 'documentary', 'editorial'],
  },
  {
    key: 'montserrat',
    label: 'Montserrat',
    category: 'sans',
    weights: [200, 400, 700],
    headingOnly: false,
    description: 'Bold, geometric, branding-forward.',
    suitableFor: ['fashion', 'bold editorial', 'modern branding'],
  },
  {
    key: 'merriweather',
    label: 'Merriweather',
    category: 'serif',
    weights: [300, 400, 700],
    headingOnly: false,
    description: 'Classic, readable serif with warmth.',
    suitableFor: ['weddings', 'family', 'storytelling', 'editorial'],
  },
  {
    key: 'lora',
    label: 'Lora',
    category: 'serif',
    weights: [400, 700],
    headingOnly: false,
    description: 'Soft, romantic serif with a gentle tone.',
    suitableFor: ['elopements', 'nature', 'portraiture'],
  },
  {
    key: 'libre-baskerville',
    label: 'Libre Baskerville',
    category: 'serif',
    weights: [400, 700],
    headingOnly: false,
    description: 'Elegant, literary, refined.',
    suitableFor: ['fine art', 'heritage', 'black-and-white'],
  },
  {
    key: 'bebas-neue',
    label: 'Bebas Neue',
    category: 'display',
    weights: [400],
    headingOnly: true,
    description: 'Bold, condensed display.',
    suitableFor: ['sports', 'automotive', 'bold branding'],
  },
  {
    key: 'abril-fatface',
    label: 'Abril Fatface',
    category: 'display',
    weights: [400],
    headingOnly: true,
    description: 'High contrast, elegant display serif.',
    suitableFor: ['fashion', 'luxury', 'editorial covers'],
  },
  {
    key: 'poiret-one',
    label: 'Poiret One',
    category: 'display',
    weights: [400],
    headingOnly: true,
    description: 'Thin, artistic, decorative.',
    suitableFor: ['conceptual', 'boutique', 'fine art'],
  },
  {
    key: 'amatic-sc',
    label: 'Amatic SC',
    category: 'display',
    weights: [400],
    headingOnly: true,
    description: 'Hand-drawn, playful, informal.',
    suitableFor: ['kids', 'casual events', 'creative brands'],
  },
  {
    key: 'oleo-script',
    label: 'Oleo Script',
    category: 'script',
    weights: [400],
    headingOnly: true,
    description: 'Friendly retro script.',
    suitableFor: ['lifestyle', 'food', 'casual branding'],
  },
  {
    key: 'pacifico',
    label: 'Pacifico',
    category: 'script',
    weights: [400],
    headingOnly: true,
    description: 'Fun and playful script.',
    suitableFor: ['travel', 'beachy', 'casual galleries'],
  },
  {
    key: 'pinyon-script',
    label: 'Pinyon Script',
    category: 'script',
    weights: [400],
    headingOnly: true,
    description: 'Formal calligraphic script.',
    suitableFor: ['luxury weddings', 'invitations'],
  },
  {
    key: 'dancing-script',
    label: 'Dancing Script',
    category: 'script',
    weights: [400, 700],
    headingOnly: true,
    description: 'Readable script with warmth.',
    suitableFor: ['portraits', 'lifestyle', 'romantic galleries'],
  },
  {
    key: 'jetbrains-mono',
    label: 'JetBrains Mono',
    category: 'mono',
    weights: [400, 700],
    headingOnly: true,
    description: 'Clean, technical mono for metadata-style displays.',
    suitableFor: ['archival', 'technical shoots', 'film labs'],
  },
  {
    key: 'atkinson-hyperlegible-next',
    label: 'Atkinson Hyperlegible Next',
    category: 'accessibility',
    weights: [400, 700],
    headingOnly: false,
    description: 'High-legibility sans designed for visual accessibility.',
    suitableFor: ['accessibility-focused galleries', 'older audiences'],
  },
  {
    key: 'atkinson-hyperlegible-mono',
    label: 'Atkinson Hyperlegible Mono',
    category: 'accessibility',
    weights: [400, 700],
    headingOnly: true,
    description: 'Monospaced companion optimized for legibility.',
    suitableFor: ['accessibility + metadata-heavy views'],
  },
] as const satisfies readonly FontDefinition[];

/** Font key type derived from the registry - add new fonts to fontRegistry array above */
export type FontKey = (typeof fontRegistry)[number]['key'];

export const fontRegistryByKey = new Map<FontKey, FontDefinition>(
  fontRegistry.map((font) => [font.key, font]),
);

export const getFontByKey = (key?: FontKey | null): FontDefinition => {
  if (!key) {
    return fontRegistry[0];
  }
  return fontRegistryByKey.get(key) ?? fontRegistry[0];
};

export const getDefaultHeadingFont = (): FontDefinition => fontRegistry[0];

/** Array of all valid font keys - use for validation and GraphQL enum generation */
export const fontKeys = fontRegistry.map((f) => f.key);

const fontKeySet = new Set<string>(fontKeys);

/** Type guard to check if a string is a valid FontKey */
export const isFontKey = (value?: string | null): value is FontKey => {
  if (!value) return false;
  return fontKeySet.has(value);
};

/** Normalize an unknown string to a valid FontKey, defaulting to 'default' */
export const normalizeFontKey = (value?: string | null): FontKey => {
  if (value && fontKeySet.has(value)) {
    return value as FontKey;
  }
  return 'default';
};
