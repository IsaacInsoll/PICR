import type { HeadingFontKey } from '@shared/gql/graphql';
import type { ComponentType } from 'react';
import {
  GalleryLayout,
  HeadingAlignment,
  PrimaryColor,
  ThemeMode,
} from '@shared/gql/graphql';
import type { FileSortDirection, FileSortType } from '@shared/files/sortFiles';
import {
  decodeFileSort,
  defaultSortDirection,
  encodeFileSort,
} from '@shared/files/sortFiles';
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
  fontCategoryLabel,
  fontDescription,
  fontRegistry,
  fontSuitabilityLabel,
  normalizeFontKey,
  toHeadingFontKeyEnumValue,
  type FontDefinition,
  type FontKey,
} from '@shared/branding/fontRegistry';
import { Trans, useTranslation } from 'react-i18next';
import { fontFamilies } from '../../fonts.generated';
import { headingFontFamily } from '../../helpers/fontFamily';
import {
  fontCategoryTranslator,
  fontDescriptionTranslator,
  fontSuitabilityTranslator,
} from '../../i18n/adminLabels';
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
  TbArrowDown,
  TbArrowUp,
  TbLink,
  TbList,
  TbLayoutColumns,
  TbLayoutGrid,
  TbLayoutRows,
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
  galleryLayout?: GalleryLayout | null;
  defaultFileSort?: string | null;
  thumbnailSize?: number | null;
  thumbnailSpacing?: number | null;
  thumbnailBorderRadius?: number | null;
  headingFontSize?: number | null;
  headingAlignment?: HeadingAlignment | null;
  footerTitle?: string | null;
  footerUrl?: string | null;
  socialLinks?: SocialLink[] | null;
}

const ALL_VIEWS = ['list', 'gallery', 'feed'] as const;
type ViewKey = (typeof ALL_VIEWS)[number];
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
  const { t } = useTranslation('admin');
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
    label: t(`branding.view.${v}`),
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
    const defaultTitle =
      SOCIAL_LINK_TYPES.find((definition) => definition.key === type)
        ?.defaultTitle ?? '';
    updateSocialLink(index, {
      url,
      type,
      title: currentLink.title || defaultTitle,
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
            {t('branding.form.tabs.branding')}
          </Tabs.Tab>
          <Tabs.Tab value="gallery" leftSection={<TbSettings size={14} />}>
            {t('branding.form.tabs.gallery')}
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
            {t('branding.form.tabs.footer')}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="branding" pt="md">
          <Stack gap="lg">
            <Divider label={t('branding.form.identity')} labelPosition="left" />
            {showName ? (
              <TextInput
                label={t('branding.form.name')}
                placeholder={t('branding.form.namePlaceholder')}
                value={branding.name ?? ''}
                onChange={(e) =>
                  onChange({ ...branding, name: e.target.value })
                }
                required
              />
            ) : null}
            <TextInput
              label={t('branding.form.logoUrl')}
              placeholder={t('branding.form.logoUrlPlaceholder')}
              value={branding.logoUrl ?? ''}
              onChange={(e) =>
                onChange({ ...branding, logoUrl: e.target.value || null })
              }
            />
            <Divider label={t('branding.form.theme')} labelPosition="left" />
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
            <Divider label={t('branding.form.views')} labelPosition="left" />
            <Box>
              <InputLabel>{t('branding.form.availableViews')}</InputLabel>
              <InputDescription pb="xs">
                {t('branding.form.availableViewsDescription')}
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
                        <span>{t(`branding.view.${view}`)}</span>
                      </Group>
                    }
                    checked={checkedViews.includes(view)}
                    onChange={() => handleViewToggle(view)}
                  />
                ))}
              </Group>
            </Box>
            <Select
              label={t('branding.form.defaultView')}
              description={t('branding.form.defaultViewDescription')}
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
            <DefaultSortSelector
              value={branding.defaultFileSort ?? null}
              onChange={(defaultFileSort) =>
                onChange({ ...branding, defaultFileSort })
              }
            />
            <Divider
              label={t('branding.form.galleryStyling')}
              labelPosition="left"
            />
            <Box>
              <InputLabel>{t('branding.form.galleryLayout')}</InputLabel>
              <InputDescription pb="xs">
                {t('branding.form.galleryLayoutDescription')}
              </InputDescription>
              <Button.Group>
                {(
                  [
                    {
                      value: GalleryLayout.Justified,
                      icon: <TbLayoutRows />,
                      labelKey: 'branding.layout.justified',
                    },
                    {
                      value: GalleryLayout.Masonry,
                      icon: <TbLayoutColumns />,
                      labelKey: 'branding.layout.masonry',
                    },
                  ] as const
                ).map((option) => {
                  const current =
                    branding.galleryLayout ?? GalleryLayout.Justified;
                  return (
                    <Button
                      key={option.value}
                      leftSection={option.icon}
                      variant={current === option.value ? 'filled' : 'default'}
                      size="xs"
                      onClick={() =>
                        onChange({
                          ...branding,
                          galleryLayout: option.value,
                        })
                      }
                    >
                      {t(option.labelKey)}
                    </Button>
                  );
                })}
              </Button.Group>
            </Box>
            <Box>
              <InputLabel>{t('branding.form.thumbnailSize')}</InputLabel>
              <PresetButtons
                presets={THUMBNAIL_SIZE_PRESETS}
                value={branding.thumbnailSize ?? null}
                defaultValue={DEFAULT_THUMBNAIL_SIZE}
                onChange={(v) => onChange({ ...branding, thumbnailSize: v })}
              />
            </Box>
            <Box>
              <InputLabel>{t('branding.form.thumbnailSpacing')}</InputLabel>
              <PresetButtons
                presets={SPACING_PRESETS}
                value={branding.thumbnailSpacing ?? null}
                defaultValue={DEFAULT_SPACING}
                onChange={(v) => onChange({ ...branding, thumbnailSpacing: v })}
              />
            </Box>
            <Box>
              <InputLabel>
                {t('branding.form.thumbnailBorderRadius')}
              </InputLabel>
              <PresetButtons
                presets={BORDER_RADIUS_PRESETS}
                value={branding.thumbnailBorderRadius ?? null}
                defaultValue={DEFAULT_BORDER_RADIUS}
                onChange={(v) =>
                  onChange({ ...branding, thumbnailBorderRadius: v })
                }
              />
            </Box>
            <Divider
              label={t('branding.form.typography')}
              labelPosition="left"
            />
            <Box>
              <InputLabel>{t('branding.form.headingSize')}</InputLabel>
              <PresetButtons
                presets={HEADING_FONT_SIZE_PRESETS}
                value={branding.headingFontSize ?? null}
                defaultValue={DEFAULT_HEADING_FONT_SIZE}
                onChange={(v) => onChange({ ...branding, headingFontSize: v })}
              />
            </Box>
            <Box>
              <InputLabel>{t('branding.form.headingAlignment')}</InputLabel>
              <Button.Group>
                {(
                  [
                    {
                      value: HeadingAlignment.Left,
                      icon: <TbAlignLeft />,
                      labelKey: 'branding.headingAlignment.left',
                    },
                    {
                      value: HeadingAlignment.Center,
                      icon: <TbAlignCenter />,
                      labelKey: 'branding.headingAlignment.center',
                    },
                  ] as const
                ).map((opt) => {
                  const current =
                    branding.headingAlignment ?? HeadingAlignment.Left;
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
                      {t(opt.labelKey)}
                    </Button>
                  );
                })}
              </Button.Group>
            </Box>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="footer" pt="md">
          <Stack gap="lg">
            <Divider label={t('branding.form.business')} labelPosition="left" />
            <TextInput
              label={t('branding.form.businessName')}
              placeholder={t('branding.form.businessNamePlaceholder')}
              value={branding.footerTitle ?? ''}
              onChange={(e) =>
                onChange({ ...branding, footerTitle: e.target.value || null })
              }
            />
            <TextInput
              label={t('branding.form.websiteUrl')}
              placeholder={t('branding.form.websiteUrlPlaceholder')}
              value={branding.footerUrl ?? ''}
              onChange={(e) =>
                onChange({ ...branding, footerUrl: e.target.value || null })
              }
            />
            <Divider
              label={t('branding.form.socialLinks')}
              labelPosition="left"
            />
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
                {t('branding.form.addLink')}
              </Button>
            </Stack>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};

const sortTypeOptions = [
  { value: 'Filename', labelKey: 'branding.sort.type.Filename' },
  { value: 'LastModified', labelKey: 'branding.sort.type.LastModified' },
  { value: 'DateTaken', labelKey: 'branding.sort.type.DateTaken' },
  // Rating and Commented are permission-gated in the live sort menu, so they
  // make poor branding defaults for viewers who cannot see review data.
  // { value: 'Rating', label: 'Rating' },
  // { value: 'RecentlyCommented', label: 'Commented' },
] as const satisfies ReadonlyArray<{
  value: FileSortType;
  labelKey:
    | 'branding.sort.type.Filename'
    | 'branding.sort.type.LastModified'
    | 'branding.sort.type.DateTaken';
}>;

const DefaultSortSelector = ({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
}) => {
  const { t } = useTranslation('admin');
  const decoded = value ? decodeFileSort(value) : null;
  const type = decoded?.type ?? '';
  const direction: FileSortDirection = decoded?.direction ?? 'Desc';
  return (
    <Box>
      <InputLabel>{t('branding.sort.label')}</InputLabel>
      <InputDescription pb="xs">
        {t('branding.sort.description')}
      </InputDescription>
      <Group gap="sm">
        <Select
          value={type}
          clearable={false}
          data={[
            { value: '', label: t('branding.sort.appDefaultFilename') },
            ...sortTypeOptions.map((option) => ({
              value: option.value,
              label: t(option.labelKey),
            })),
          ]}
          onChange={(v) =>
            onChange(
              v
                ? encodeFileSort({
                    type: v as FileSortType,
                    // Apply the type's natural default direction on type change;
                    // the admin can still flip it with the buttons below.
                    direction: defaultSortDirection(v as FileSortType),
                  })
                : null,
            )
          }
        />
        {type ? (
          <Button.Group>
            {(['Asc', 'Desc'] as FileSortDirection[]).map((d) => (
              <Button
                key={d}
                variant={direction === d ? 'filled' : 'default'}
                size="xs"
                onClick={() =>
                  onChange(
                    encodeFileSort({
                      type: type as FileSortType,
                      direction: d,
                    }),
                  )
                }
              >
                {t(`branding.sort.direction.${d}`)}
              </Button>
            ))}
          </Button.Group>
        ) : null}
      </Group>
    </Box>
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
  const { t } = useTranslation('admin');
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
          {t('branding.form.custom')}
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
  const { t } = useTranslation('admin');
  const typeOptions = SOCIAL_LINK_TYPES.map((definition) => ({
    value: definition.key,
    label: t(`branding.socialType.${definition.key}`),
  }));
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
            placeholder={t(`branding.socialPlaceholder.${link.type}`)}
            value={link.url}
            onChange={(e) => onUrlChange(e.target.value)}
            style={{ flex: 1 }}
            leftSection={
              normalizedPreview && normalizedPreview !== link.url ? (
                <Tooltip
                  label={t('branding.social.willSaveAs', {
                    value: normalizedPreview,
                  })}
                >
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
            placeholder={t('branding.social.labelPlaceholder')}
            value={link.title}
            onChange={(e) => onChange({ title: e.target.value })}
            size="sm"
            style={{ flex: 1 }}
          />
          <Checkbox
            label={t('branding.social.newTab')}
            checked={link.openInNewTab}
            onChange={(e) =>
              onChange({ openInNewTab: e.currentTarget.checked })
            }
            size="sm"
          />
          <Group gap={4}>
            <Tooltip label={t('branding.social.moveUp')}>
              <ActionIcon
                variant="default"
                size="sm"
                disabled={index === 0}
                onClick={() => onMove('up')}
              >
                <TbArrowUp />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t('branding.social.moveDown')}>
              <ActionIcon
                variant="default"
                size="sm"
                disabled={index === total - 1}
                onClick={() => onMove('down')}
              >
                <TbArrowDown />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t('branding.social.remove')}>
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

const HeadingFontSelector = ({
  value,
  onChange,
}: {
  value: FontKey;
  onChange: (value: FontKey) => void;
}) => {
  const { t } = useTranslation('admin');
  const translateCategory = fontCategoryTranslator(t);
  const translateDescription = fontDescriptionTranslator(t);
  const translateSuitability = fontSuitabilityTranslator(t);
  const grouped = Object.entries(
    fontRegistry.reduce<Record<string, FontDefinition[]>>((acc, font) => {
      const group = fontCategoryLabel(font.category, translateCategory);
      if (!(group in acc)) acc[group] = [];
      acc[group].push(font);
      return acc;
    }, {}),
  ).map(([group, items]) => ({
    group,
    items: items.map((font) => ({
      value: font.key,
      label: font.label,
      description: `${fontDescription(font, translateDescription)}${
        font.headingOnly ? ` (${t('font.headingOnly')})` : ''
      }`,
      suitableFor: font.suitableFor.map((key) =>
        fontSuitabilityLabel(key, translateSuitability),
      ),
    })),
  }));

  return (
    <Box>
      <InputLabel>{t('font.label')}</InputLabel>
      <InputDescription>{t('font.help')}</InputDescription>
      <Select
        data={grouped}
        value={value}
        searchable
        clearable={false}
        styles={{
          input: {
            fontFamily: headingFontFamily(
              fontFamilies[value as keyof typeof fontFamilies],
            ),
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
              fontFamily: headingFontFamily(
                fontFamilies[option.value as keyof typeof fontFamilies],
              ),
            }}
          >
            <div>{option.label}</div>
            {(option as { description?: string }).description ? (
              <InputDescription>
                {(option as { description?: string }).description}
              </InputDescription>
            ) : null}
            {(option as { suitableFor?: string[] }).suitableFor?.length ? (
              <Box c="dimmed" fz="xs">
                <Group gap={4} wrap="wrap">
                  {(option as { suitableFor?: string[] }).suitableFor?.map(
                    (tag: string) => (
                      <Badge key={tag} size="xs" variant="light" color="gray">
                        {tag}
                      </Badge>
                    ),
                  )}
                </Group>
              </Box>
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
  const { t } = useTranslation('admin');
  return (
    <Box>
      <InputLabel>{t('branding.mode.label')}</InputLabel>
      <InputDescription pb="xs">
        <Trans
          t={t}
          i18nKey="branding.mode.description"
          components={{ code: <Code />, emphasis: <em /> }}
        />
      </InputDescription>
      <Button.Group>
        {modeOptions.map((opt) => {
          const isSelected = opt.value === value;
          const { icon } = themeModeStyle[opt.value];
          return (
            <Button
              leftSection={icon}
              title={t(opt.labelKey)}
              variant={isSelected ? 'filled' : 'default'}
              onClick={() => onChange(opt.value)}
              key={opt.value}
              size="xs"
            >
              {t(opt.labelKey)}
            </Button>
          );
        })}
      </Button.Group>
    </Box>
  );
};

const modeOptions = [
  { value: ThemeMode.Auto, labelKey: 'branding.mode.auto' },
  { value: ThemeMode.Light, labelKey: 'branding.mode.light' },
  { value: ThemeMode.Dark, labelKey: 'branding.mode.dark' },
] as const;

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
  const { t } = useTranslation('admin');
  const options = Object.values(PrimaryColor);
  const theme = useMantineTheme();

  return (
    <>
      <Box>
        <InputLabel>{t('branding.form.color')}</InputLabel>
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
