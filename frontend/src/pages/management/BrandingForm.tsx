import type { HeadingFontKey } from '@shared/gql/graphql';
import type { ComponentType } from 'react';
import { PrimaryColor, ThemeMode } from '@shared/gql/graphql';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  Code,
  Divider,
  Group,
  InputDescription,
  InputLabel,
  Select,
  Stack,
  Tabs,
  TextInput,
  Tooltip,
  useMantineTheme,
} from '@mantine/core';
import {
  BrightnessAutoIcon,
  CheckIcon,
  DarkModeOutlineIcon,
  LightModeOutlineIcon,
} from '../../PicrIcons';
import {
  fontRegistry,
  normalizeFontKey,
  toHeadingFontKeyEnumValue,
  type FontDefinition,
  type FontKey,
} from '@shared/branding/fontRegistry';
import { fontFamilies } from '../../fonts.generated';
import {
  BORDER_RADIUS_PRESETS,
  DEFAULT_BORDER_RADIUS,
  DEFAULT_HEADING_FONT_SIZE,
  DEFAULT_SPACING,
  DEFAULT_THUMBNAIL_SIZE,
  HEADING_FONT_SIZE_PRESETS,
  matchPreset,
  SPACING_PRESETS,
  THUMBNAIL_SIZE_PRESETS,
} from '@shared/branding/galleryPresets';
import type {
  SocialLink,
  SocialLinkTypeKey,
} from '@shared/branding/socialLinkTypes';
import {
  detectSocialLinkType,
  normalizeSocialLinkInput,
  SOCIAL_LINK_TYPES,
  shouldAutoDetectSocialLinkType,
} from '@shared/branding/socialLinkTypes';
import { SocialLinkIcon } from '../../components/SocialLinkIcon';
import {
  TbAlignCenter,
  TbAlignLeft,
  TbAlignRight,
  TbArrowDown,
  TbArrowUp,
  TbLink,
  TbList,
  TbLayoutGrid,
  TbPalette,
  TbPhoto,
  TbPlus,
  TbSettings,
  TbTrash,
} from 'react-icons/tb';

export interface BrandingInput {
  id?: string;
  name?: string | null;
  mode?: ThemeMode | null;
  primaryColor?: PrimaryColor | null;
  logoUrl?: string | null;
  headingFontKey?: HeadingFontKey | null;
  availableViews?: string[] | null;
  defaultView?: string | null;
  thumbnailSize?: number | null;
  thumbnailSpacing?: number | null;
  thumbnailBorderRadius?: number | null;
  headingFontSize?: number | null;
  headingAlignment?: string | null;
  footerTitle?: string | null;
  footerUrl?: string | null;
  socialLinks?: SocialLink[] | null;
}

const ALL_VIEWS = ['list', 'gallery', 'feed'] as const;
type ViewKey = (typeof ALL_VIEWS)[number];
const viewLabels: Record<ViewKey, string> = {
  list: 'List',
  gallery: 'Gallery',
  feed: 'Feed',
};
const viewIcons: Record<ViewKey, ComponentType<{ size?: number }>> = {
  list: TbList,
  gallery: TbLayoutGrid,
  feed: TbPhoto,
};

export const BrandingForm = ({
  branding,
  onChange,
  showName = false,
}: {
  branding: BrandingInput;
  onChange: (branding: BrandingInput) => void;
  showName?: boolean;
}) => {
  const checkedViews: ViewKey[] =
    (branding.availableViews?.length ?? 0) > 0
      ? (branding.availableViews as ViewKey[])
      : [...ALL_VIEWS];

  const handleViewToggle = (view: ViewKey) => {
    const next = checkedViews.includes(view)
      ? checkedViews.filter((v) => v !== view)
      : [...checkedViews, view];
    if (next.length === 0) return; // must keep at least one
    const restricted = next.length < ALL_VIEWS.length ? next : null;
    const defaultView =
      restricted && !restricted.includes(branding.defaultView as ViewKey)
        ? restricted[0]
        : branding.defaultView;
    onChange({ ...branding, availableViews: restricted, defaultView });
  };

  const socialLinks: SocialLink[] = branding.socialLinks ?? [];
  const defaultViewOptions = checkedViews.map((v) => ({
    value: v,
    label: viewLabels[v],
  }));
  const defaultView =
    defaultViewOptions.some((v) => v.value === branding.defaultView) &&
    branding.defaultView
      ? branding.defaultView
      : checkedViews[0];

  const addSocialLink = () => {
    onChange({
      ...branding,
      socialLinks: [
        ...socialLinks,
        { type: 'website', title: '', url: '', openInNewTab: true },
      ],
    });
  };

  const updateSocialLink = (index: number, patch: Partial<SocialLink>) => {
    const next = socialLinks.map((link, i) =>
      i === index ? { ...link, ...patch } : link,
    );
    onChange({ ...branding, socialLinks: next });
  };

  const removeSocialLink = (index: number) => {
    onChange({
      ...branding,
      socialLinks: socialLinks.filter((_, i) => i !== index),
    });
  };

  const moveSocialLink = (index: number, direction: 'up' | 'down') => {
    const next = [...socialLinks];
    const swap = direction === 'up' ? index - 1 : index + 1;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    onChange({ ...branding, socialLinks: next });
  };

  const handleUrlChange = (index: number, url: string) => {
    const currentLink = socialLinks[index];
    const shouldDetectType =
      currentLink.type === 'website' && shouldAutoDetectSocialLinkType(url);
    const type = shouldDetectType
      ? detectSocialLinkType(url)
      : currentLink.type;
    const label = SOCIAL_LINK_TYPES.find((t) => t.key === type)?.label ?? '';
    updateSocialLink(index, {
      url,
      type,
      title: currentLink.title || label,
    });
  };

  return (
    <Stack gap="lg">
      <Tabs defaultValue="branding">
        <Tabs.List>
          <Tabs.Tab
            value="branding"
            leftSection={<TbPalette size={14} />}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Branding
          </Tabs.Tab>
          <Tabs.Tab value="gallery" leftSection={<TbSettings size={14} />}>
            Gallery Appearance
          </Tabs.Tab>
          <Tabs.Tab
            value="footer"
            leftSection={<TbLink size={14} />}
            onClick={() =>
              window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth',
              })
            }
          >
            Footer
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="branding" pt="md">
          <Stack gap="lg">
            <Divider label="Identity" labelPosition="left" />
            {showName ? (
              <TextInput
                label="Name"
                placeholder="Branding name"
                value={branding.name ?? ''}
                onChange={(e) =>
                  onChange({ ...branding, name: e.target.value })
                }
                required
              />
            ) : null}
            <TextInput
              label="Logo URL"
              placeholder="https://example.com/logo.png"
              value={branding.logoUrl ?? ''}
              onChange={(e) =>
                onChange({ ...branding, logoUrl: e.target.value || null })
              }
            />
            <Divider label="Theme" labelPosition="left" />
            <HeadingFontSelector
              value={normalizeFontKey(branding.headingFontKey)}
              onChange={(headingFontKey) =>
                onChange({
                  ...branding,
                  headingFontKey: toHeadingFontKeyEnumValue(headingFontKey),
                })
              }
            />
            <ModeSelector
              value={branding.mode ?? ThemeMode.Auto}
              onChange={(mode) => onChange({ ...branding, mode })}
            />
            <ColorSelector
              color={branding.primaryColor ?? PrimaryColor.Blue}
              onChange={(primaryColor) =>
                onChange({ ...branding, primaryColor })
              }
            />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="gallery" pt="md">
          <Stack gap="lg">
            <Divider label="Views" labelPosition="left" />
            <Box>
              <InputLabel>Available views</InputLabel>
              <InputDescription pb="xs">
                Restrict which views Link users can access. Admins always see
                all views.
              </InputDescription>
              <Group gap="sm">
                {ALL_VIEWS.map((view) => (
                  <Checkbox
                    key={view}
                    label={
                      <Group gap={6} wrap="nowrap">
                        {(() => {
                          const ViewIcon = viewIcons[view];
                          return <ViewIcon size={14} />;
                        })()}
                        <span>{viewLabels[view]}</span>
                      </Group>
                    }
                    checked={checkedViews.includes(view)}
                    onChange={() => handleViewToggle(view)}
                  />
                ))}
              </Group>
            </Box>
            <Select
              label="Default view"
              description="Where Link users land when opening the gallery"
              value={defaultView}
              data={defaultViewOptions}
              onChange={(v) => onChange({ ...branding, defaultView: v })}
              clearable={false}
              leftSection={
                defaultView
                  ? (() => {
                      const ViewIcon = viewIcons[defaultView as ViewKey];
                      return <ViewIcon size={14} />;
                    })()
                  : null
              }
              renderOption={({ option }) => (
                <Group gap={6} wrap="nowrap">
                  {(() => {
                    const ViewIcon = viewIcons[option.value as ViewKey];
                    return <ViewIcon size={14} />;
                  })()}
                  <span>{option.label}</span>
                </Group>
              )}
            />
            <Divider label="Gallery Styling" labelPosition="left" />
            <Box>
              <InputLabel>Thumbnail size</InputLabel>
              <PresetButtons
                presets={THUMBNAIL_SIZE_PRESETS}
                value={branding.thumbnailSize ?? null}
                defaultValue={DEFAULT_THUMBNAIL_SIZE}
                onChange={(v) => onChange({ ...branding, thumbnailSize: v })}
              />
            </Box>
            <Box>
              <InputLabel>Thumbnail spacing</InputLabel>
              <PresetButtons
                presets={SPACING_PRESETS}
                value={branding.thumbnailSpacing ?? null}
                defaultValue={DEFAULT_SPACING}
                onChange={(v) => onChange({ ...branding, thumbnailSpacing: v })}
              />
            </Box>
            <Box>
              <InputLabel>Thumbnail border radius</InputLabel>
              <PresetButtons
                presets={BORDER_RADIUS_PRESETS}
                value={branding.thumbnailBorderRadius ?? null}
                defaultValue={DEFAULT_BORDER_RADIUS}
                onChange={(v) =>
                  onChange({ ...branding, thumbnailBorderRadius: v })
                }
              />
            </Box>
            <Divider label="Typography" labelPosition="left" />
            <Box>
              <InputLabel>Heading size</InputLabel>
              <PresetButtons
                presets={HEADING_FONT_SIZE_PRESETS}
                value={branding.headingFontSize ?? null}
                defaultValue={DEFAULT_HEADING_FONT_SIZE}
                onChange={(v) => onChange({ ...branding, headingFontSize: v })}
              />
            </Box>
            <Box>
              <InputLabel>Heading alignment</InputLabel>
              <Button.Group>
                {(
                  [
                    { value: 'left', icon: <TbAlignLeft />, label: 'Left' },
                    {
                      value: 'center',
                      icon: <TbAlignCenter />,
                      label: 'Center',
                    },
                    { value: 'right', icon: <TbAlignRight />, label: 'Right' },
                  ] as const
                ).map((opt) => {
                  const current = branding.headingAlignment ?? 'left';
                  return (
                    <Button
                      key={opt.value}
                      leftSection={opt.icon}
                      variant={current === opt.value ? 'filled' : 'default'}
                      size="xs"
                      onClick={() =>
                        onChange({ ...branding, headingAlignment: opt.value })
                      }
                    >
                      {opt.label}
                    </Button>
                  );
                })}
              </Button.Group>
            </Box>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="footer" pt="md">
          <Stack gap="lg">
            <Divider label="Business" labelPosition="left" />
            <TextInput
              label="Business name"
              placeholder="Your Studio Name"
              value={branding.footerTitle ?? ''}
              onChange={(e) =>
                onChange({ ...branding, footerTitle: e.target.value || null })
              }
            />
            <TextInput
              label="Website URL"
              placeholder="https://yourstudio.com"
              value={branding.footerUrl ?? ''}
              onChange={(e) =>
                onChange({ ...branding, footerUrl: e.target.value || null })
              }
            />
            <Divider label="Social Links" labelPosition="left" />
            <Stack gap="xs">
              {socialLinks.map((link, index) => (
                <SocialLinkRow
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  link={link}
                  index={index}
                  total={socialLinks.length}
                  onUrlChange={(url) => handleUrlChange(index, url)}
                  onChange={(patch) => updateSocialLink(index, patch)}
                  onRemove={() => removeSocialLink(index)}
                  onMove={(dir) => moveSocialLink(index, dir)}
                />
              ))}
              <Button
                variant="default"
                leftSection={<TbPlus />}
                size="xs"
                onClick={addSocialLink}
                style={{ alignSelf: 'flex-start' }}
              >
                Add link
              </Button>
            </Stack>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};

const PresetButtons = ({
  presets,
  value,
  defaultValue,
  onChange,
}: {
  presets: Record<string, number>;
  value: number | null;
  defaultValue: number;
  onChange: (value: number) => void;
}) => {
  const effective = value ?? defaultValue;
  const matched = matchPreset(presets, effective);
  return (
    <Button.Group>
      {Object.entries(presets).map(([key, px]) => {
        const isSelected = px === effective;
        return (
          <Button
            key={key}
            variant={isSelected ? 'filled' : 'default'}
            size="compact-xs"
            style={{ minWidth: 36, paddingInline: 8 }}
            onClick={() => onChange(px)}
          >
            {key.toUpperCase()}
          </Button>
        );
      })}
      {!matched ? (
        <Button
          variant="default"
          size="compact-xs"
          style={{ minWidth: 36, paddingInline: 8 }}
          disabled
        >
          Custom
        </Button>
      ) : null}
    </Button.Group>
  );
};

const SocialLinkRow = ({
  link,
  index,
  total,
  onUrlChange,
  onChange,
  onRemove,
  onMove,
}: {
  link: SocialLink;
  index: number;
  total: number;
  onUrlChange: (url: string) => void;
  onChange: (patch: Partial<SocialLink>) => void;
  onRemove: () => void;
  onMove: (dir: 'up' | 'down') => void;
}) => {
  const typeOptions = SOCIAL_LINK_TYPES.map((t) => ({
    value: t.key,
    label: t.label,
  }));
  const urlPlaceholderByType: Partial<Record<SocialLinkTypeKey, string>> = {
    instagram: 'yourstudio or https://instagram.com/yourstudio',
    facebook: 'yourpage or https://facebook.com/yourpage',
    tiktok: 'yourhandle or https://tiktok.com/@yourhandle',
    youtube: 'https://youtube.com/@yourchannel',
    twitter: 'yourhandle or https://x.com/yourhandle',
    pinterest: 'yourname or https://pinterest.com/yourname',
    linkedin: 'yourname or https://linkedin.com/in/yourname',
    whatsapp: '61400111222 or https://wa.me/61400111222',
    vimeo: 'yourname or https://vimeo.com/yourname',
    google_review: 'Paste your review link',
    email: 'you@example.com',
    phone: '+61400111222',
    website: 'https://yourstudio.com',
  };
  const normalizedPreview = normalizeSocialLinkInput(link.type, link.url);

  return (
    <Box
      p="xs"
      style={(theme) => ({
        border: `1px solid ${theme.colors.gray[3]}`,
        borderRadius: theme.radius.sm,
      })}
    >
      <Stack gap="xs">
        <Group gap="xs" wrap="nowrap">
          <Select
            data={typeOptions}
            value={link.type}
            onChange={(v) => v && onChange({ type: v as SocialLinkTypeKey })}
            style={{ width: 140 }}
            size="sm"
            leftSection={<SocialLinkIcon type={link.type} size={14} />}
            renderOption={({ option }) => (
              <Group gap="xs" wrap="nowrap">
                <SocialLinkIcon
                  type={option.value as SocialLinkTypeKey}
                  size={14}
                />
                <span>{option.label}</span>
              </Group>
            )}
          />
          <TextInput
            placeholder={urlPlaceholderByType[link.type]}
            value={link.url}
            onChange={(e) => onUrlChange(e.target.value)}
            style={{ flex: 1 }}
            leftSection={
              normalizedPreview && normalizedPreview !== link.url ? (
                <Tooltip label={`Will save as: ${normalizedPreview}`}>
                  <Box
                    component="span"
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <SocialLinkIcon type={link.type} size={16} />
                  </Box>
                </Tooltip>
              ) : (
                <SocialLinkIcon type={link.type} size={16} />
              )
            }
          />
        </Group>
        <Group gap="xs" justify="space-between">
          <TextInput
            placeholder="Label (e.g. Follow us)"
            value={link.title}
            onChange={(e) => onChange({ title: e.target.value })}
            size="sm"
            style={{ flex: 1 }}
          />
          <Checkbox
            label="New tab"
            checked={link.openInNewTab}
            onChange={(e) =>
              onChange({ openInNewTab: e.currentTarget.checked })
            }
            size="sm"
          />
          <Group gap={4}>
            <Tooltip label="Move up">
              <ActionIcon
                variant="default"
                size="sm"
                disabled={index === 0}
                onClick={() => onMove('up')}
              >
                <TbArrowUp />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Move down">
              <ActionIcon
                variant="default"
                size="sm"
                disabled={index === total - 1}
                onClick={() => onMove('down')}
              >
                <TbArrowDown />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Remove">
              <ActionIcon
                variant="default"
                size="sm"
                color="red"
                onClick={onRemove}
              >
                <TbTrash />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Stack>
    </Box>
  );
};

const categoryLabels: Record<string, string> = {
  sans: 'Sans Serif',
  serif: 'Serif',
  display: 'Display',
  script: 'Script',
  mono: 'Mono',
  accessibility: 'Accessibility',
};

const HeadingFontSelector = ({
  value,
  onChange,
}: {
  value: FontKey;
  onChange: (value: FontKey) => void;
}) => {
  const grouped = Object.entries(
    fontRegistry.reduce<Record<string, FontDefinition[]>>((acc, font) => {
      const group = categoryLabels[font.category] ?? font.category;
      if (!(group in acc)) acc[group] = [];
      acc[group].push(font);
      return acc;
    }, {}),
  ).map(([group, items]) => ({
    group,
    items: items.map((font) => ({
      value: font.key,
      label: font.label,
      description: `${font.description}${
        font.headingOnly ? ' (Heading only)' : ''
      }`,
      suitableFor: font.suitableFor,
    })),
  }));

  return (
    <Box>
      <InputLabel>Heading font</InputLabel>
      <InputDescription>
        Applies to titles and section headers only
      </InputDescription>
      <Select
        data={grouped}
        value={value}
        searchable
        clearable={false}
        styles={{
          input: {
            fontFamily: fontFamilies[value as keyof typeof fontFamilies],
          },
        }}
        onChange={(next) => {
          if (next != null) onChange(next as FontKey);
        }}
        renderOption={({ option }) => (
          <Stack
            gap="xs"
            pb="sm"
            style={{
              fontFamily:
                fontFamilies[option.value as keyof typeof fontFamilies],
            }}
          >
            <div>{option.label}</div>
            {(option as { description?: string }).description ? (
              <InputDescription>
                {(option as { description?: string }).description}
              </InputDescription>
            ) : null}
            {(option as { suitableFor?: string[] }).suitableFor?.length ? (
              <InputDescription>
                <Group gap={4} wrap="wrap">
                  {(option as { suitableFor?: string[] }).suitableFor?.map(
                    (tag: string) => (
                      <Badge key={tag} size="xs" variant="light" color="gray">
                        {tag}
                      </Badge>
                    ),
                  )}
                </Group>
              </InputDescription>
            ) : null}
          </Stack>
        )}
      />
    </Box>
  );
};

const ModeSelector = ({
  value,
  onChange,
}: {
  value: ThemeMode;
  onChange: (value: ThemeMode) => void;
}) => {
  return (
    <Box>
      <InputLabel>Theme</InputLabel>
      <InputDescription pb="xs">
        <Code>auto</Code> means <em>'match what the users device is set to'</em>
      </InputDescription>
      <Button.Group>
        {modeOptions.map((opt) => {
          const isSelected = opt === value;
          const { icon } = themeModeStyle[opt];
          return (
            <Button
              leftSection={icon}
              title={opt}
              variant={isSelected ? 'filled' : 'default'}
              onClick={() => onChange(opt)}
              key={opt}
              size="xs"
            >
              {opt}
            </Button>
          );
        })}
      </Button.Group>
    </Box>
  );
};

const modeOptions: ThemeMode[] = [
  ThemeMode.Auto,
  ThemeMode.Light,
  ThemeMode.Dark,
];

const themeModeStyle = {
  [ThemeMode.Auto]: { icon: <BrightnessAutoIcon /> },
  [ThemeMode.Light]: { icon: <LightModeOutlineIcon /> },
  [ThemeMode.Dark]: { icon: <DarkModeOutlineIcon /> },
};

const ColorSelector = ({
  color,
  onChange,
}: {
  color: PrimaryColor;
  onChange: (color: PrimaryColor) => void;
}) => {
  const options = Object.values(PrimaryColor);
  const theme = useMantineTheme();

  return (
    <>
      <Box>
        <InputLabel>Color</InputLabel>
        <InputDescription>
          <Code c={color}>{color}</Code>
        </InputDescription>
      </Box>
      <Group gap="xs">
        {options.map((c) => {
          return (
            <ActionIcon
              size="xs"
              color={c}
              variant="filled"
              key={c}
              onClick={() => onChange(c)}
            >
              {c === color ? <CheckIcon /> : null}
            </ActionIcon>
          );
        })}
      </Group>
      <Group gap={0}>
        {Array.from({ length: 10 }, (x, i) => {
          return (
            <Box
              key={i}
              style={{
                backgroundColor: theme.colors[color][i],
                flexGrow: 1,
                height: 2,
              }}
            ></Box>
          );
        })}
      </Group>
    </>
  );
};
